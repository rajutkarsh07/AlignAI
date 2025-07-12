const { VertexAI } = require('@google-cloud/vertexai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
const Task = require('../models/Task');
const Roadmap = require('../models/Roadmap');

class AgentService {
  constructor() {
    this.useVertexAI = process.env.USE_VERTEX_AI === 'true';
    
    if (this.useVertexAI) {
      // Initialize Vertex AI
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
      });
      
      this.model = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.4,
          topP: 0.95,
        },
      });
    } else {
      // Initialize Gemini API
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.4,
          topP: 0.95,
        },
      });
    }

    console.log(`🤖 Agent Service initialized using ${this.useVertexAI ? 'Vertex AI' : 'Gemini API Key'}`);

    this.agents = {
      general: this.createGeneralAgent(),
      roadmap: this.createRoadmapAgent(),
      taskEnhancer: this.createTaskEnhancerAgent()
    };
  }

  async generateContent(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      
      if (this.useVertexAI) {
        return result.response.candidates[0].content.parts[0].text;
      } else {
        return result.response.text();
      }
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  // General purpose agent for questions and analysis
  createGeneralAgent() {
    const self = this;
    return {
      systemMessage: `You are an expert product management assistant with deep knowledge of:
- Product strategy and roadmapping
- Customer feedback analysis
- Agile development methodologies
- Business prioritization frameworks
- User experience principles
- Market research and competitive analysis

CORE CAPABILITIES:
- Answer questions about product management best practices
- Analyze customer feedback patterns and trends
- Provide strategic recommendations
- Help with prioritization decisions
- Explain complex product concepts
- Search external sources when needed for current information

CONTEXT AWARENESS:
- You have access to the current project's official plan and goals
- You know about all customer feedback and its analysis
- You understand the current task backlog and priorities
- You can reference specific feedback items and project objectives

COMMUNICATION STYLE:
- Be clear, concise, and actionable
- Use data and examples to support recommendations
- Ask clarifying questions when needed
- Provide multiple perspectives when appropriate
- Always consider both strategic goals and customer needs

EXAMPLE SCENARIOS:
- "What are the top customer pain points in our feedback?"
- "How does our roadmap align with industry best practices?"
- "What should we prioritize: fixing bugs or building new features?"
- "Can you find recent trends in [specific topic] for our industry?"

Remember: You are helping product managers make informed, balanced decisions that serve both business objectives and customer needs.`,

      async processQuery(query, projectContext, feedbackContext, additionalContext = {}) {
        const prompt = `You are an expert product management assistant with access to detailed project information.

${projectContext ? `
CURRENT PROJECT CONTEXT:
${projectContext}

When the user asks about "this project" or "the project", they are referring to the project above.
` : `
GLOBAL CONTEXT:
${projectContext}

The user hasn't selected a specific project yet.
`}

CUSTOMER FEEDBACK SUMMARY:
${feedbackContext}

CONVERSATION CONTEXT:
${JSON.stringify(additionalContext, null, 2)}

USER QUERY: ${query}

INSTRUCTIONS:
- If the user asks about "this project", "the project", or project-specific details, refer to the current project context above
- Provide specific, actionable insights about the project's current status, goals, and situation
- If asking about project status, mention: current progress, initial plans vs current state, any blockers or issues
- Be conversational and helpful, not overly formal
- Focus on practical information that a product manager would find useful
- If no specific project is selected and they ask about "this project", suggest they select a project first

Please provide a comprehensive, actionable response:`;

        try {
          return await self.generateContent(prompt);
        } catch (error) {
          console.error('General agent error:', error);
          throw new Error('Failed to process query');
        }
      }
    };
  }

  // Specialized agent for roadmap generation
  createRoadmapAgent() {
    const self = this;
    return {
      systemMessage: `You are a specialized roadmap generation agent with expertise in:
- Strategic roadmap planning
- Resource allocation optimization
- Timeline estimation
- Risk assessment
- Stakeholder alignment
- Competitive positioning

ROADMAP GENERATION PRINCIPLES:
1. Balance strategic objectives with customer feedback
2. Consider resource constraints and dependencies
3. Prioritize based on impact, effort, and urgency
4. Include measurable success metrics
5. Account for technical debt and maintenance
6. Plan for iterative delivery and feedback loops

ALLOCATION STRATEGIES:
- Strategic-focused: 70% strategic goals, 20% customer requests, 10% maintenance
- Customer-driven: 20% strategic goals, 70% customer requests, 10% maintenance
- Balanced: 60% strategic goals, 30% customer requests, 10% maintenance
- Custom: User-defined percentages

OUTPUT FORMAT:
Generate detailed roadmap items with:
- Clear titles and descriptions
- Priority levels and categories
- Time estimates and dependencies
- Resource requirements
- Success metrics
- Risk assessments
- Customer quotes supporting decisions

EXAMPLE QUERIES:
- "Create a balanced roadmap for Q1 2024"
- "Show me a customer-driven plan focusing on bug fixes"
- "Generate a 6-month strategic roadmap with 70/20/10 allocation"`,

      async generateRoadmap(query, projectContext, feedbackContext, parameters = {}) {
        const {
          timeHorizon = 'quarter',
          allocationType = 'balanced',
          focusAreas = [],
          constraints = []
        } = parameters;

        const allocationStrategies = {
          'strategic-only': { strategic: 70, customerDriven: 20, maintenance: 10 },
          'customer-only': { strategic: 20, customerDriven: 70, maintenance: 10 },
          'balanced': { strategic: 60, customerDriven: 30, maintenance: 10 },
          'custom': parameters.customAllocation || { strategic: 60, customerDriven: 30, maintenance: 10 }
        };

        const allocation = allocationStrategies[allocationType];

        const prompt = `
You are generating a comprehensive product roadmap based on the following requirements:

PROJECT CONTEXT:
${projectContext}

CUSTOMER FEEDBACK ANALYSIS:
${feedbackContext}

ROADMAP PARAMETERS:
- Time Horizon: ${timeHorizon}
- Allocation Strategy: ${allocationType}
- Strategic Work: ${allocation.strategic}%
- Customer-Driven Work: ${allocation.customerDriven}%
- Maintenance Work: ${allocation.maintenance}%
- Focus Areas: ${focusAreas.join(', ') || 'Not specified'}
- Constraints: ${constraints.join(', ') || 'None specified'}

USER REQUEST: ${query}

Generate a detailed roadmap in the following JSON format:
{
  "name": "Generated Roadmap Name",
  "description": "Brief description of the roadmap approach",
  "type": "${allocationType}",
  "timeHorizon": "${timeHorizon}",
  "allocationStrategy": ${JSON.stringify(allocation)},
  "items": [
    {
      "title": "Feature/Task Title",
      "description": "Detailed description",
      "category": "strategic|customer-driven|maintenance|innovation",
      "priority": "critical|high|medium|low",
      "timeframe": {
        "quarter": "Q1 2024",
        "estimatedDuration": {
          "value": 2,
          "unit": "weeks"
        }
      },
      "resourceAllocation": {
        "percentage": 15,
        "teamMembers": 3,
        "estimatedCost": 50000
      },
      "dependencies": ["Dependency 1", "Dependency 2"],
      "relatedFeedback": [
        {
          "relevanceScore": 8,
          "customerQuotes": ["Customer quote supporting this item"]
        }
      ],
      "businessJustification": {
        "strategicAlignment": 8,
        "customerImpact": 7,
        "revenueImpact": 6,
        "riskLevel": "medium"
      },
      "successMetrics": ["Metric 1", "Metric 2"],
      "status": "proposed"
    }
  ],
  "rationale": "Explanation of the roadmap decisions and prioritization logic"
}

Ensure the roadmap:
1. Follows the specified allocation percentages
2. Includes 8-12 roadmap items
3. Balances quick wins with long-term strategic goals
4. References specific customer feedback
5. Provides clear business justification
6. Includes realistic timelines and resource estimates

Respond only with valid JSON.`;

        try {
          const response = await self.generateContent(prompt);
          const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(cleanedResponse);
        } catch (error) {
          console.error('Roadmap generation error:', error);
          throw new Error('Failed to generate roadmap');
        }
      }
    };
  }

  // Specialized agent for task enhancement
  createTaskEnhancerAgent() {
    const self = this;
    return {
      systemMessage: `You are a specialized task enhancement agent focused on:
- Converting high-level ideas into actionable tasks
- Adding technical specifications and acceptance criteria
- Identifying dependencies and risks
- Estimating effort and resources
- Connecting tasks to customer feedback
- Suggesting implementation approaches

ENHANCEMENT PRINCIPLES:
1. Make tasks specific, measurable, and actionable
2. Include clear acceptance criteria
3. Consider technical constraints and dependencies
4. Link to customer feedback when relevant
5. Provide effort estimates
6. Identify potential risks and mitigation strategies
7. Suggest success metrics

TASK CATEGORIES:
- Feature: New functionality or capabilities
- Bug Fix: Resolving defects or issues
- Improvement: Enhancing existing features
- Research: Investigation or discovery work
- Maintenance: Technical debt or infrastructure
- Design: UX/UI design work
- Testing: Quality assurance activities

OUTPUT COMPONENTS:
- Enhanced description with technical details
- Acceptance criteria checklist
- Effort estimation
- Risk assessment
- Resource requirements
- Success metrics
- Implementation recommendations`,

      async enhanceTask(title, description, projectContext, feedbackContext) {
        const prompt = `
You are enhancing a task with detailed specifications and recommendations.

PROJECT CONTEXT:
${projectContext}

RELEVANT CUSTOMER FEEDBACK:
${feedbackContext}

TASK TO ENHANCE:
Title: ${title}
Description: ${description}

Provide enhanced task details in the following JSON format:
{
  "enhancedDescription": "Detailed, actionable description with technical specifications",
  "category": "feature|bug-fix|improvement|research|maintenance|design|testing",
  "priority": "critical|high|medium|low",
  "estimatedEffort": {
    "value": 5,
    "unit": "days"
  },
  "acceptanceCriteria": [
    "Specific acceptance criterion 1",
    "Specific acceptance criterion 2"
  ],
  "aiSuggestions": {
    "enhancementRecommendations": [
      "Enhancement recommendation 1",
      "Enhancement recommendation 2"
    ],
    "riskAssessment": "Detailed risk analysis",
    "resourceRequirements": [
      "Frontend developer",
      "Backend developer"
    ],
    "successMetrics": [
      "Measurable success metric 1",
      "Measurable success metric 2"
    ]
  },
  "businessValue": {
    "customerImpact": "high|medium|low",
    "revenueImpact": "high|medium|low|none",
    "strategicAlignment": 8
  },
  "tags": ["tag1", "tag2"],
  "relatedFeedback": [
    {
      "relevanceScore": 8,
      "summary": "How this task addresses specific feedback"
    }
  ]
}

Focus on making the task actionable, well-specified, and connected to customer value.

Respond only with valid JSON.`;

        try {
          const response = await self.generateContent(prompt);
          const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(cleanedResponse);
        } catch (error) {
          console.error('Task enhancement error:', error);
          throw new Error('Failed to enhance task');
        }
      }
    };
  }

  // Main method to route queries to appropriate agents
  async processQuery(agentType, query, projectId = null, additionalParams = {}) {
    try {
      // Get project context (support both project-specific and global chat)
      let projectContext = '';
      if (projectId) {
        const project = await Project.findById(projectId);
        if (project) {
          projectContext = `
Project: ${project.name}
Description: ${project.description}
Official Plan: ${project.formattedPlan || project.officialPlan}
Goals: ${project.goals.map(g => `${g.title}: ${g.description}`).join('; ')}
`;
        }
      } else {
        // Global context - get overview of all projects
        const allProjects = await Project.find({}).limit(10);
        projectContext = `
GLOBAL CONTEXT - Available Projects:
${allProjects.map(p => `• ${p.name}: ${p.description}`).join('\n')}
Total Projects: ${allProjects.length}

Note: This is a general consultation. For project-specific advice, please select a specific project.
`;
      }

      // Get feedback context (project-specific or global)
      let feedbackContext = '';
      if (projectId) {
        const feedbackDocs = await Feedback.find({ projectId, isActive: true });
        const allFeedbackItems = feedbackDocs.flatMap(doc => 
          doc.feedbackItems.filter(item => !item.isIgnored)
        );
        
        feedbackContext = `
Total Feedback Items: ${allFeedbackItems.length}
Top Categories: ${this.getFeedbackCategorySummary(allFeedbackItems)}
Key Themes: ${this.getTopKeywords(allFeedbackItems)}
Recent High-Priority Items: ${this.getHighPriorityFeedback(allFeedbackItems)}
`;
      } else {
        // Global feedback overview
        const allFeedbackDocs = await Feedback.find({ isActive: true }).limit(100);
        const allFeedbackItems = allFeedbackDocs.flatMap(doc => 
          doc.feedbackItems.filter(item => !item.isIgnored)
        );
        
        feedbackContext = `
GLOBAL FEEDBACK OVERVIEW:
Total Feedback Items: ${allFeedbackItems.length}
Top Categories: ${this.getFeedbackCategorySummary(allFeedbackItems)}
Key Themes: ${this.getTopKeywords(allFeedbackItems)}
`;
      }

      // Route to appropriate agent with fallback
      const agent = this.agents[agentType] || this.agents.general;

      try {
        switch (agentType) {
          case 'general':
            return await agent.processQuery(query, projectContext, feedbackContext, additionalParams);
          
          case 'roadmap':
            if (!projectId) {
              return this.getProjectSelectionMessage('roadmap generation');
            }
            return await agent.generateRoadmap(query, projectContext, feedbackContext, additionalParams);
          
          case 'taskEnhancer':
            const { title, description } = additionalParams;
            return await agent.enhanceTask(title, description, projectContext, feedbackContext);
          
          default:
            return await this.agents.general.processQuery(query, projectContext, feedbackContext, additionalParams);
        }
      } catch (aiError) {
        console.warn('AI generation failed, using fallback:', aiError.message);
        return this.getFallbackResponse(query, agentType, projectId);
      }
    } catch (error) {
      console.error('Agent processing error:', error);
      return this.getFallbackResponse(query, agentType, projectId);
    }
  }

  // Improved fallback responses when AI fails
  getFallbackResponse(query, agentType, projectId) {
    const responses = {
      projects: `I can help you with information about your projects. Currently you have several projects available. You can:

**📋 Project Management:**
- View project details and goals
- Create new projects
- Update project descriptions and plans

**🗣️ Common Questions I Can Help With:**
- "Show me all projects"
- "What are the current project goals?"
- "Help me create a new project"

**📊 Analytics & Insights:**
- Review project progress
- Analyze feedback trends
- Track task completion

Would you like me to help you with any of these areas?`,

      roadmap: `I'd be happy to help you create a roadmap! Here's what I can assist with:

**🗺️ Roadmap Generation:**
- Balanced roadmaps (strategic + customer feedback)
- Timeline planning (quarterly, yearly)
- Priority-based task organization
- Resource allocation strategies

**📊 Roadmap Types:**
- **Strategic Focus:** Company goals first
- **Customer-Driven:** Feedback-based priorities  
- **Balanced Approach:** Mix of both
- **Custom Allocation:** Your specific percentages

**💡 Example Requests:**
- "Create a Q1 roadmap focusing on customer feedback"
- "Generate a balanced 6-month plan"
- "Show me strategic priorities for this year"

${projectId ? '' : '💡 **Tip:** Select a specific project for detailed roadmap generation!'}`,

      general: `I'm your AI product management assistant! Here's how I can help:

**🎯 Product Strategy:**
- Analyze customer feedback patterns
- Balance business goals with user needs
- Provide prioritization frameworks
- Strategic decision support

**📋 Project Management:**
- Roadmap planning and optimization
- Task breakdown and enhancement
- Timeline and resource estimation
- Risk assessment and mitigation

**📊 Analysis & Insights:**
- Customer feedback analysis
- Market trend evaluation  
- Competitive positioning
- Performance metrics guidance

**🚀 Quick Actions:**
- Ask about specific product challenges
- Request roadmap recommendations
- Get help prioritizing features
- Analyze customer feedback themes

What would you like to work on today?`
    };

    // Determine response type based on query content
    const queryLower = query.toLowerCase();
    if (queryLower.includes('project') || queryLower.includes('what') && queryLower.includes('have')) {
      return responses.projects;
    } else if (queryLower.includes('roadmap') || queryLower.includes('plan')) {
      return responses.roadmap;
    } else {
      return responses.general;
    }
  }

  getProjectSelectionMessage(feature) {
    return `To use ${feature}, please select a specific project from the dropdown above. This will give me the context I need to provide detailed, project-specific recommendations.

**Available Projects:** You can choose from your existing projects or create a new one.

**Why Project Selection Matters:**
- Tailored recommendations based on your project goals
- Context-aware feedback analysis  
- Strategic alignment with your specific objectives
- More accurate resource and timeline estimates

Once you select a project, I'll be able to provide much more detailed and actionable insights!`;
  }

  // Helper methods for context analysis
  getFeedbackCategorySummary(feedbackItems) {
    const categories = {};
    feedbackItems.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');
  }

  getTopKeywords(feedbackItems) {
    const keywords = {};
    feedbackItems.forEach(item => {
      item.extractedKeywords.forEach(keyword => {
        keywords[keyword] = (keywords[keyword] || 0) + 1;
      });
    });
    return Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword)
      .join(', ');
  }

  getHighPriorityFeedback(feedbackItems) {
    return feedbackItems
      .filter(item => ['critical', 'high'].includes(item.priority))
      .slice(0, 3)
      .map(item => `"${item.content.substring(0, 100)}..."`)
      .join('; ');
  }

  // External search integration with Tavily when needed
  async searchExternalInformation(query) {
    // This would integrate with Tavily MCP server for external searches
    // Implementation depends on the MCP server setup
    try {
      // Placeholder for Tavily integration
      return {
        query,
        results: [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('External search error:', error);
      return null;
    }
  }
}

module.exports = new AgentService();
