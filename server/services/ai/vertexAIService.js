const { VertexAI } = require('@google-cloud/vertexai');

class VertexAIService {
  constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.VERTEX_AI_PROJECT_ID,
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
    });
    
    this.model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generation_config: {
        max_output_tokens: 8192,
        temperature: 0.7,
        top_p: 0.8,
        top_k: 40,
      },
    });
  }

  // Chat Agent - for general questions and context-aware responses
  async chatWithAgent(messages, projectContext, feedbackContext) {
    try {
      const systemPrompt = this.buildChatSystemPrompt(projectContext, feedbackContext);
      
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I am your AI assistant for product roadmap planning. I have access to your project goals and customer feedback. How can I help you today?' }],
          },
        ],
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      
      return {
        success: true,
        response: response.text(),
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
        }
      };
    } catch (error) {
      console.error('Chat Agent Error:', error);
      return {
        success: false,
        error: error.message,
        response: 'I apologize, but I encountered an error processing your request. Please try again.'
      };
    }
  }

  // Roadmap Agent - for generating visual roadmaps and task cards
  async generateRoadmap(request, projectContext, feedbackContext) {
    try {
      const systemPrompt = this.buildRoadmapSystemPrompt(projectContext, feedbackContext);
      
      const prompt = `
${systemPrompt}

User Request: ${request}

Please generate a detailed roadmap with the following structure:
1. Analysis of the request
2. Balanced task breakdown
3. Timeline recommendations
4. Priority assignments
5. Resource allocation suggestions

Format the response as JSON with the following structure:
{
  "analysis": "Brief analysis of the request",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "category": "company_goal|customer_feedback|technical_debt|innovation",
      "priority": "low|medium|high|critical",
      "effort": "small|medium|large|epic",
      "estimatedHours": number,
      "timeline": {
        "startDate": "YYYY-MM-DD",
        "dueDate": "YYYY-MM-DD"
      },
      "dependencies": [],
      "tags": ["tag1", "tag2"],
      "metrics": {
        "customerImpact": 1-10,
        "businessValue": 1-10,
        "technicalComplexity": 1-10
      },
      "reasoning": "Why this task is important"
    }
  ],
  "timeline": {
    "totalWeeks": number,
    "phases": [
      {
        "name": "Phase name",
        "duration": "X weeks",
        "tasks": ["task1", "task2"]
      }
    ]
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON response
      try {
        const roadmapData = JSON.parse(text);
        return {
          success: true,
          data: roadmapData,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        };
      } catch (parseError) {
        // If JSON parsing fails, return the text response
        return {
          success: true,
          data: {
            analysis: "Generated roadmap",
            tasks: [],
            timeline: { totalWeeks: 0, phases: [] },
            recommendations: [text]
          },
          rawResponse: text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        };
      }
    } catch (error) {
      console.error('Roadmap Generation Error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Task Suggestion Agent - for enhancing task descriptions
  async suggestTaskEnhancements(taskDescription, projectContext, feedbackContext) {
    try {
      const systemPrompt = this.buildTaskSuggestionSystemPrompt(projectContext, feedbackContext);
      
      const prompt = `
${systemPrompt}

Task Description: ${taskDescription}

Please analyze this task and provide suggestions for:
1. Enhanced description
2. Relevant tags
3. Estimated effort
4. Related customer feedback
5. Priority justification

Format the response as JSON:
{
  "enhancedDescription": "Improved task description",
  "suggestedTags": ["tag1", "tag2"],
  "estimatedEffort": "small|medium|large|epic",
  "relatedFeedback": [
    {
      "summary": "Feedback summary",
      "relevance": 0.0-1.0
    }
  ],
  "reasoning": "Why these suggestions are relevant",
  "priority": "low|medium|high|critical",
  "category": "company_goal|customer_feedback|technical_debt|innovation"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const suggestions = JSON.parse(text);
        return {
          success: true,
          suggestions,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        };
      } catch (parseError) {
        return {
          success: true,
          suggestions: {
            enhancedDescription: taskDescription,
            suggestedTags: [],
            estimatedEffort: 'medium',
            relatedFeedback: [],
            reasoning: text,
            priority: 'medium',
            category: 'company_goal'
          },
          rawResponse: text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        };
      }
    } catch (error) {
      console.error('Task Suggestion Error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: null
      };
    }
  }

  // Feedback Analysis Agent - for processing and categorizing feedback
  async analyzeFeedback(feedbackContent, projectContext) {
    try {
      const prompt = `
You are an expert product manager analyzing customer feedback. 

Project Context:
${projectContext}

Feedback to analyze:
${feedbackContent}

Please analyze this feedback and provide:
1. Category classification
2. Priority assessment
3. Sentiment analysis
4. Key points extraction
5. Suggested actions

Format the response as JSON:
{
  "category": "bug|feature_request|complaint|praise|suggestion|question",
  "priority": "low|medium|high|critical",
  "sentiment": "positive|neutral|negative",
  "keyPoints": ["point1", "point2"],
  "suggestedActions": ["action1", "action2"],
  "summary": "Brief summary",
  "impactScore": 1-10,
  "tags": ["tag1", "tag2"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const analysis = JSON.parse(text);
        return {
          success: true,
          analysis,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        };
      } catch (parseError) {
        return {
          success: true,
          analysis: {
            category: 'suggestion',
            priority: 'medium',
            sentiment: 'neutral',
            keyPoints: [],
            suggestedActions: [],
            summary: text,
            impactScore: 5,
            tags: []
          },
          rawResponse: text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        };
      }
    } catch (error) {
      console.error('Feedback Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  // Helper methods for building system prompts
  buildChatSystemPrompt(projectContext, feedbackContext) {
    return `You are an intelligent AI assistant for product roadmap planning. Your role is to help product managers make informed decisions by balancing company goals with customer feedback.

PROJECT CONTEXT:
${projectContext || 'No project context available'}

CUSTOMER FEEDBACK SUMMARY:
${feedbackContext || 'No customer feedback available'}

Your capabilities:
1. Answer questions about project planning and strategy
2. Provide insights based on customer feedback
3. Suggest balanced approaches to product development
4. Help prioritize features and improvements
5. Generate actionable recommendations

Always consider both the company's strategic goals and customer needs when providing advice. Be specific, actionable, and data-driven in your responses.`;
  }

  buildRoadmapSystemPrompt(projectContext, feedbackContext) {
    return `You are an expert product roadmap generator. Your task is to create balanced roadmaps that consider both company goals and customer feedback.

PROJECT CONTEXT:
${projectContext || 'No project context available'}

CUSTOMER FEEDBACK SUMMARY:
${feedbackContext || 'No customer feedback available'}

Guidelines for roadmap generation:
1. Balance company goals (60-70%) with customer feedback (30-40%)
2. Consider technical debt and maintenance (10-20%)
3. Prioritize based on business value and customer impact
4. Provide realistic timelines and effort estimates
5. Include dependencies and resource requirements
6. Consider risk factors and mitigation strategies

Always provide actionable, specific tasks with clear deliverables and success criteria.`;
  }

  buildTaskSuggestionSystemPrompt(projectContext, feedbackContext) {
    return `You are an expert task enhancer for product development. Your role is to improve task descriptions and provide relevant suggestions based on project context and customer feedback.

PROJECT CONTEXT:
${projectContext || 'No project context available'}

CUSTOMER FEEDBACK SUMMARY:
${feedbackContext || 'No customer feedback available'}

Guidelines for task enhancement:
1. Make descriptions more specific and actionable
2. Suggest relevant tags for categorization
3. Provide realistic effort estimates
4. Link tasks to relevant customer feedback
5. Consider dependencies and prerequisites
6. Align with project goals and timeline

Always provide practical, implementable suggestions that add value to the task.`;
  }
}

module.exports = new VertexAIService(); 