const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleGenAI } = require('@google/genai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class AIService {
  constructor() {
    this.useVertexAI = process.env.USE_VERTEX_AI === 'true';

    if (this.useVertexAI) {
      this.ai = new GoogleGenAI({
        vertexai: true,
        project: 'itd-ai-interns',
        location: 'global',
      });

      this.model = 'gemini-2.5-flash';

      this.generationConfig = {
        maxOutputTokens: 65535,
        temperature: 1,
        topP: 1,
        seed: 0,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'OFF',
          },
        ],
      };

      console.log('🤖 Agent Service initialized in aiService using Vertex AI');
    } else {
      // Initialize Gemini API
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.3,
          topP: 0.95,
        },
      });
    }

    console.log(
      `🤖 AI Service initialized using ${this.useVertexAI ? 'Vertex AI' : 'Gemini API Key'
      }`
    );
  }

  // Validate if the query is project-related
  isProjectRelatedQuery(prompt) {
    const projectKeywords = [
      'project', 'task', 'feedback', 'bug', 'feature', 'requirement',
      'development', 'product', 'user', 'customer', 'issue', 'enhancement',
      'improvement', 'roadmap', 'sprint', 'story', 'epic', 'backlog',
      'priority', 'timeline', 'deadline', 'milestone', 'release',
      'documentation', 'plan', 'planning', 'analysis', 'test', 'testing',
      'design', 'ui', 'ux', 'api', 'database', 'implementation',
      'deployment', 'performance', 'security', 'integration', 'workflow',
      'process', 'team', 'collaboration', 'review', 'approval',
      'stakeholder', 'business', 'objective', 'goal', 'metric',
      'kpi', 'success', 'criteria', 'scope', 'resource', 'budget',
      'risk', 'mitigation', 'technical', 'functional', 'non-functional'
    ];

    const normalizedPrompt = prompt.toLowerCase();

    // Check if any project keywords are present
    const hasProjectKeywords = projectKeywords.some(keyword =>
      normalizedPrompt.includes(keyword)
    );

    // Check for common non-project queries patterns
    const nonProjectPatterns = [
      /who is\s+\w+/i,
      /what is\s+\w+.*born/i,
      /tell me about\s+(?!project|task|feedback)\w+/i,
      /cricket/i,
      /sports/i,
      /celebrity/i,
      /actor/i,
      /actress/i,
      /singer/i,
      /politician/i,
      /history of\s+(?!project|development|software)\w+/i,
      /capital of/i,
      /weather/i,
      /recipe/i,
      /cooking/i,
      /movie/i,
      /film/i,
      /song/i,
      /music/i,
      /book/i,
      /novel/i
    ];

    const hasNonProjectPatterns = nonProjectPatterns.some(pattern =>
      pattern.test(normalizedPrompt)
    );

    return hasProjectKeywords && !hasNonProjectPatterns;
  }

  // Enhanced generateContent with input validation
  async generateContent(prompt, context = 'general') {
    try {
      // For specific contexts (like formatProjectPlan, analyzeFeedback), skip validation
      const allowedContexts = ['project-plan', 'feedback-analysis', 'task-enhancement', 'document-processing'];

      if (!allowedContexts.includes(context) && !this.isProjectRelatedQuery(prompt)) {
        return "I'm sorry, but I can only assist with project-related queries, including feedback analysis, task management, project planning, and development-related questions. Please ask me something related to your project, tasks, or feedback.";
      }

      // Add system instruction to restrict responses
      const systemInstruction = `
IMPORTANT SYSTEM RESTRICTION:
You are a specialized AI assistant for project management, task planning, and feedback analysis. 
You must ONLY respond to queries related to:
- Project planning and management
- Task creation and enhancement
- Feedback analysis and categorization
- Software development and product management
- Business objectives and requirements
- Technical documentation and implementation

If asked about anything unrelated to projects, tasks, feedback, or business/technical topics, 
politely decline and redirect the user to ask project-related questions.

USER QUERY: ${prompt}
`;

      if (this.useVertexAI) {
        const req = {
          model: this.model,
          contents: [systemInstruction],
          config: this.generationConfig,
        };

        const response = await this.ai.models.generateContent(req);
        return response.text;
      } else {
        const result = await this.model.generateContent(systemInstruction);
        return result.response.text();
      }
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  // Extract text from various document formats
  async extractTextFromDocument(buffer, mimeType) {
    try {
      let extractedText = '';

      if (mimeType === 'application/pdf') {
        const data = await pdf(buffer);
        extractedText = data.text;
      } else if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (mimeType === 'text/plain') {
        extractedText = buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      return extractedText;
    } catch (error) {
      console.error('Error extracting text from document:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  // Format project description into structured plan
  async formatProjectPlan(rawDescription) {
    const prompt = `
You are an expert product manager assistant. Your task is to transform a raw project description into a well-structured, comprehensive project plan.

SYSTEM INSTRUCTIONS:
- You must analyze the raw input and extract key information
- Structure the output as a professional project plan
- Identify goals, objectives, timelines, and success metrics
- Use clear, actionable language
- Be comprehensive but concise

INPUT PROJECT DESCRIPTION:
${rawDescription}

OUTPUT FORMAT:
Please provide a structured project plan with the following sections:

## Project Overview
[2-3 sentence summary of the project]

## Key Objectives
[List 3-5 main objectives]

## Success Metrics
[List measurable success criteria]

## Target Timeline
[Quarter/timeframe information]

## Strategic Priorities
[List key strategic focus areas]

## Resource Requirements
[High-level resource needs]

## Risk Considerations
[Potential risks and mitigation strategies]

Ensure the output is professional, actionable, and comprehensive.`;

    try {
      return await this.generateContent(prompt, 'project-plan');
    } catch (error) {
      console.error('Error formatting project plan:', error);
      throw new Error('Failed to format project plan');
    }
  }

  // Analyze and categorize feedback
  async analyzeFeedback(feedbackText) {
    const prompt = `
You are an expert feedback analyst specializing in customer feedback analysis for product management.

SYSTEM INSTRUCTIONS:
- Analyze the provided feedback text thoroughly
- Extract key insights, sentiment, and actionable items
- Categorize feedback appropriately based on content
- Identify relevant keywords and themes
- Provide urgency assessment
- Consider context and tone of the feedback

FEEDBACK TO ANALYZE:
${feedbackText}

Please provide analysis in the following JSON format:
{
  "category": "bug-report|feature-request|improvement|complaint|praise|question|other",
  "sentiment": "positive|negative|neutral",
  "priority": "critical|high|medium|low",
  "extractedKeywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "Brief but comprehensive summary of the feedback",
  "actionableItems": ["specific action1", "specific action2"],
  "relatedFeatures": ["feature1", "feature2"],
  "urgencyScore": 5
}

Guidelines:
- Bug reports: Issues, crashes, errors, broken functionality
- Feature requests: New features, enhancements, missing functionality
- Improvements: Suggestions for better UX, performance, design
- Complaints: Negative experiences, frustrations, problems
- Praise: Positive experiences, compliments, satisfaction
- Questions: Inquiries, clarifications, support requests

Respond only with valid JSON.`;

    try {
      const response = await this.generateContent(prompt, 'feedback-analysis');

      // Clean and parse JSON response
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      // Return default analysis if AI fails
      return {
        category: 'other',
        sentiment: 'neutral',
        priority: 'medium',
        extractedKeywords: [],
        summary: feedbackText.substring(0, 100) + '...',
        actionableItems: [],
        relatedFeatures: [],
        urgencyScore: 5,
      };
    }
  }

  // Enhanced document processing for better feedback extraction
  async processDocumentFeedback(rawText, projectContext = '') {
    const prompt = `
You are an expert document processor specializing in extracting and analyzing customer feedback from various document formats.

SYSTEM INSTRUCTIONS:
- Process the raw text and identify individual feedback items
- Separate different feedback points clearly
- Maintain context and meaning
- Identify feedback patterns and themes
- Provide structured output for further analysis

PROJECT CONTEXT (if available):
${projectContext}

RAW DOCUMENT TEXT:
${rawText}

Please process this text and provide:
1. Individual feedback items (separated by meaningful breaks)
2. Overall themes and patterns
3. Key insights for product improvement

Output format:
{
  "feedbackItems": [
    {
      "content": "Individual feedback text",
      "type": "feedback type",
      "context": "additional context if any"
    }
  ],
  "themes": ["theme1", "theme2"],
  "insights": ["insight1", "insight2"]
}

Respond only with valid JSON.`;

    try {
      const response = await this.generateContent(prompt, 'document-processing');
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error processing document feedback:', error);
      // Fallback to simple text splitting
      const feedbackItems = rawText
        .split(/\n\s*\n|\r\n\s*\r\n|\.\s*\n/)
        .map((item) => item.trim())
        .filter((item) => item.length > 20)
        .map((content) => ({
          content,
          type: 'general',
          context: '',
        }));

      return {
        feedbackItems,
        themes: [],
        insights: [],
      };
    }
  }

  // Generate enhanced task description
  async enhanceTaskDescription(
    title,
    description,
    projectContext,
    feedbackContext
  ) {
    const prompt = `
You are an expert product manager and task enhancement specialist.

SYSTEM INSTRUCTIONS:
- Enhance the provided task with actionable details
- Consider project context and customer feedback
- Provide concrete recommendations
- Focus on implementation clarity and business value

PROJECT CONTEXT:
${projectContext}

CUSTOMER FEEDBACK CONTEXT:
${feedbackContext}

TASK TO ENHANCE:
Title: ${title}
Description: ${description}

Please provide enhanced task information in the following format:

## Enhanced Description
[Detailed, actionable description]

## Acceptance Criteria
[List of specific acceptance criteria]

## Implementation Recommendations
[Technical and design recommendations]

## Customer Impact
[How this addresses customer needs]

## Success Metrics
[Measurable outcomes]

## Risk Assessment
[Potential risks and mitigation]

## Resource Requirements
[Estimated effort and resources needed]

Ensure recommendations are practical, specific, and aligned with customer feedback.`;

    try {
      return await this.generateContent(prompt, 'task-enhancement');
    } catch (error) {
      console.error('Error enhancing task description:', error);
      throw new Error('Failed to enhance task description');
    }
  }

  // New method for general chat queries with restrictions
  async processChatQuery(userQuery) {
    try {
      // Validate if the query is project-related
      if (!this.isProjectRelatedQuery(userQuery)) {
        return {
          response: "I'm sorry, but I can only assist with project-related queries. I can help you with:\n\n• Project planning and management\n• Task creation and enhancement\n• Feedback analysis and categorization\n• Software development questions\n• Product management strategies\n• Technical documentation\n• Business requirements and objectives\n\nPlease ask me something related to your project, tasks, or feedback analysis.",
          isRestricted: true
        };
      }

      const response = await this.generateContent(userQuery, 'general');
      return {
        response,
        isRestricted: false
      };
    } catch (error) {
      console.error('Error processing chat query:', error);
      throw new Error('Failed to process chat query');
    }
  }
}

module.exports = new AIService();
