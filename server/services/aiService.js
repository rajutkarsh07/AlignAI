const { VertexAI } = require('@google-cloud/vertexai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const { GoogleGenAI } = require('@google/genai');

class AIService {
  constructor() {
    this.useVertexAI = process.env.USE_VERTEX_AI === 'true';

    if (this.useVertexAI) {
      // const ai = new GoogleGenAI({
      //   vertexai: true,
      //   project: 'itd-ai-interns',
      //   location: 'global'
      // });

      // this.model = ai.getGenerativeModel({
      //   model: 'gemini-2.0-flash-exp',
      //   generationConfig: {
      //     maxOutputTokens: 8192,
      //     temperature: 0.3,
      //     topP: 0.95,
      //   },
      // });

      this.ai = new GoogleGenAI({
        vertexai: true,
        project: 'itd-ai-interns',
        location: 'global'
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
          }
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
      `🤖 AI Service initialized using ${
        this.useVertexAI ? 'Vertex AI' : 'Gemini API Key'
      }`
    );
  }

  async generateContent(prompt) {
    try {
      if(this.useVertexAI){
        const req = {
          model: this.model,
          contents: [prompt],
          config: this.generationConfig,
        };

        const response = await this.ai.models.generateContent(req);
        return response.text;
      }
      else{
        const result = await this.model.generateContent(prompt);
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
      return await this.generateContent(prompt);
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
      const response = await this.generateContent(prompt);

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
      const response = await this.generateContent(prompt);
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
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Error enhancing task description:', error);
      throw new Error('Failed to enhance task description');
    }
  }
}

module.exports = new AIService();
