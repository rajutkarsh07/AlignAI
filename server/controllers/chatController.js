const { v4: uuidv4 } = require('uuid');
const ChatSession = require('../models/ChatSession');
const Project = require('../models/Project');
const agentService = require('../services/agentService');

// Get all chat sessions for a project
const getProjectSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Verify project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const sessions = await ChatSession.find({
      projectId: req.params.projectId,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-messages'); // Exclude messages for list view

    const total = await ChatSession.countDocuments({
      projectId: req.params.projectId,
      isActive: true,
    });

    res.json({
      success: true,
      data: sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat sessions',
    });
  }
};

// Get chat session by ID
const getSessionById = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
    }).populate('projectId', 'name description');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat session',
    });
  }
};

// Create new chat session
const createSession = async (req, res) => {
  try {
    const { projectId, title } = req.body;

    // For global chat, projectId is optional
    if (projectId) {
      // Verify project exists if projectId is provided
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }
    }

    const sessionId = uuidv4();

    const chatSession = new ChatSession({
      projectId: projectId || null, // Allow null for global chat
      sessionId,
      title:
        title || (projectId ? 'Project Chat Session' : 'General Chat Session'),
      messages: [],
    });

    const savedSession = await chatSession.save();

    res.status(201).json({
      success: true,
      data: savedSession,
      message: 'Chat session created successfully',
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat session',
    });
  }
};

// Send message to chat session
const sendMessage = async (req, res) => {
  try {
    const { content, agent = 'general', searchQuery } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    const startTime = Date.now();

    // Add user message
    session.messages.push({
      role: 'user',
      content,
      metadata: {
        agent,
        searchResults: searchQuery ? [] : undefined,
      },
    });

    // Generate title if this is the first message
    if (session.messages.length === 1) {
      session.generateTitle();
    }

    // External search if needed
    let searchResults = [];
    if (searchQuery) {
      try {
        // Use Tavily MCP for external search
        searchResults = await performExternalSearch(searchQuery);
      } catch (searchError) {
        console.warn('External search failed:', searchError);
      }
    }

    // Process message with appropriate agent
    try {
      let response;
      const additionalParams = {
        searchResults,
        conversationHistory: session.messages.slice(-10), // Last 10 messages for context
      };

      if (agent === 'roadmap') {
        // Extract roadmap parameters from content
        const roadmapParams = extractRoadmapParameters(content);
        response = await agentService.processQuery(
          'roadmap',
          content,
          session.projectId,
          { ...additionalParams, ...roadmapParams }
        );
      } else if (agent === 'taskEnhancer') {
        // For task enhancement, extract title and description
        const taskParams = extractTaskParameters(content);
        if (taskParams.title && taskParams.description) {
          response = await agentService.processQuery(
            'taskEnhancer',
            content,
            session.projectId,
            { ...additionalParams, ...taskParams }
          );
        } else {
          response =
            'I need a task title and description to enhance a task. Please provide both in your message.';
        }
      } else {
        // General agent
        response = await agentService.processQuery(
          'general',
          content,
          session.projectId,
          additionalParams
        );
      }

      const processingTime = Date.now() - startTime;

      // Add assistant response
      session.messages.push({
        role: 'assistant',
        content:
          typeof response === 'object'
            ? JSON.stringify(response, null, 2)
            : response,
        metadata: {
          agent,
          searchResults: searchResults.length > 0 ? searchResults : undefined,
          processingTime,
        },
      });

      // Update session context
      session.context.currentAgent = agent;
      session.context.lastQuery = content;

      const updatedSession = await session.save();

      // Emit real-time update via Socket.io
      const io = req.app.get('io');
      if (session.projectId) {
        io.to(session.projectId.toString()).emit('chat-message', {
          sessionId: session.sessionId,
          message: session.messages[session.messages.length - 1],
        });
      }

      res.json({
        success: true,
        data: {
          session: updatedSession,
          response:
            typeof response === 'object' ? response : { text: response },
          metadata: {
            processingTime,
            agent,
            searchResults,
          },
        },
        message: 'Message processed successfully',
      });
    } catch (agentError) {
      console.error('Agent processing error:', agentError);

      // Add error response
      session.messages.push({
        role: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
        metadata: {
          agent,
          error: agentError.message,
          processingTime: Date.now() - startTime,
        },
      });

      await session.save();

      res.status(500).json({
        success: false,
        error: 'Failed to process message',
        details: agentError.message,
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
};

// Update chat session
const updateSession = async (req, res) => {
  try {
    const { title, context } = req.body;

    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    if (title) session.title = title;
    if (context) session.context = { ...session.context, ...context };

    const updatedSession = await session.save();

    res.json({
      success: true,
      data: updatedSession,
      message: 'Chat session updated successfully',
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chat session',
    });
  }
};

// Delete chat session (soft delete)
const deleteSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    session.isActive = false;
    await session.save();

    res.json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat session',
    });
  }
};

// Clear chat session messages
const clearSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    session.messages = [];
    session.context.lastQuery = '';
    session.title = 'New Chat Session';

    const updatedSession = await session.save();

    res.json({
      success: true,
      data: updatedSession,
      message: 'Chat session cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat session',
    });
  }
};

// Export chat session
const exportSession = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
    }).populate('projectId', 'name description');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="chat-${session.sessionId}.json"`
      );
      res.json(session);
    } else if (format === 'txt') {
      const textContent = convertSessionToText(session);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="chat-${session.sessionId}.txt"`
      );
      res.send(textContent);
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported export format. Use json or txt.',
      });
    }
  } catch (error) {
    console.error('Error exporting chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export chat session',
    });
  }
};

// Helper method to perform external search using Tavily MCP
const performExternalSearch = async (query) => {
  try {
    // This would integrate with the Tavily MCP server
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error('External search error:', error);
    return [];
  }
};

// Helper method to extract roadmap parameters from user message
const extractRoadmapParameters = (content) => {
  const params = {
    timeHorizon: 'quarter',
    allocationType: 'balanced',
    focusAreas: [],
    constraints: [],
  };

  // Simple keyword extraction
  if (content.toLowerCase().includes('strategic')) {
    params.allocationType = 'strategic-only';
  } else if (content.toLowerCase().includes('customer')) {
    params.allocationType = 'customer-only';
  }

  if (content.toLowerCase().includes('year')) {
    params.timeHorizon = 'year';
  } else if (
    content.toLowerCase().includes('6 month') ||
    content.toLowerCase().includes('half year')
  ) {
    params.timeHorizon = 'half-year';
  }

  return params;
};

// Helper method to extract task parameters from user message
const extractTaskParameters = (content) => {
  const params = {};

  // Try to extract title and description from various formats
  const titleMatch = content.match(/title[:\s]+([^\n\r]+)/i);
  const descMatch = content.match(/description[:\s]+([^\n\r]+)/i);

  if (titleMatch) {
    params.title = titleMatch[1].trim();
  }

  if (descMatch) {
    params.description = descMatch[1].trim();
  }

  // If no explicit format, try to infer
  if (!params.title && !params.description) {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length >= 2) {
      params.title = lines[0].trim();
      params.description = lines.slice(1).join(' ').trim();
    }
  }

  return params;
};

// Helper method to convert session to text format
const convertSessionToText = (session) => {
  let text = `Chat Session: ${session.title}\n`;
  text += `Project: ${session.projectId.name}\n`;
  text += `Created: ${session.createdAt.toISOString()}\n`;
  text += `Updated: ${session.updatedAt.toISOString()}\n`;
  text += `\n${'='.repeat(50)}\n\n`;

  session.messages.forEach((message, index) => {
    text += `[${index + 1}] ${message.role.toUpperCase()}\n`;
    text += `Time: ${message.timestamp.toISOString()}\n`;
    if (message.metadata.agent) {
      text += `Agent: ${message.metadata.agent}\n`;
    }
    text += `\n${message.content}\n\n`;
    text += `${'-'.repeat(30)}\n\n`;
  });

  return text;
};

module.exports = {
  getProjectSessions,
  getSessionById,
  createSession,
  sendMessage,
  updateSession,
  deleteSession,
  clearSession,
  exportSession,
};
