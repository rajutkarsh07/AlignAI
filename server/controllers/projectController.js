const Project = require('../models/Project');
const documentProcessor = require('../services/fileProcessing/documentProcessor');
const vertexAIService = require('../services/ai/vertexAIService');

class ProjectController {
  // Get current project
  async getCurrentProject(req, res) {
    try {
      if (global.demoMode) {
        const demoProject = global.demoData.projects[global.demoData.projects.length - 1];
        if (!demoProject) {
          return res.status(404).json({
            success: false,
            message: 'No project found. Please create a project first.'
          });
        }
        return res.json({
          success: true,
          data: demoProject
        });
      }

      const project = await Project.findOne().sort({ createdAt: -1 });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'No project found. Please create a project first.'
        });
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve project',
        error: error.message
      });
    }
  }

  // Create or update project
  async createOrUpdateProject(req, res) {
    try {
      const {
        name,
        description,
        goals,
        timeline,
        stakeholders,
        budget,
        status,
        tags
      } = req.body;

      // Validate required fields
      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: 'Project name and description are required'
        });
      }

      if (global.demoMode) {
        // Handle demo mode
        const demoProject = {
          _id: Date.now().toString(),
          name,
          description,
          goals: goals || [],
          timeline: timeline || {},
          stakeholders: stakeholders || [],
          budget: budget || {},
          status: status || 'planning',
          tags: tags || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Update or add to demo data
        const existingIndex = global.demoData.projects.findIndex(p => p._id === demoProject._id);
        if (existingIndex >= 0) {
          global.demoData.projects[existingIndex] = demoProject;
        } else {
          global.demoData.projects.push(demoProject);
        }

        return res.json({
          success: true,
          message: 'Project created successfully (Demo Mode)',
          data: demoProject
        });
      }

      // Check if project exists
      let project = await Project.findOne().sort({ createdAt: -1 });

      if (project) {
        // Update existing project
        project.name = name;
        project.description = description;
        project.goals = goals || [];
        project.timeline = timeline || {};
        project.stakeholders = stakeholders || [];
        project.budget = budget || {};
        project.status = status || project.status;
        project.tags = tags || [];
      } else {
        // Create new project
        project = new Project({
          name,
          description,
          goals: goals || [],
          timeline: timeline || {},
          stakeholders: stakeholders || [],
          budget: budget || {},
          status: status || 'planning',
          tags: tags || []
        });
      }

      await project.save();

      res.json({
        success: true,
        message: project._id ? 'Project updated successfully' : 'Project created successfully',
        data: project
      });
    } catch (error) {
      console.error('Create/update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create/update project',
        error: error.message
      });
    }
  }

  // Upload project document
  async uploadProjectDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { originalname, path, size } = req.file;

      // Validate file
      if (!documentProcessor.validateFileType(originalname)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file format. Please upload PDF, DOCX, DOC, or TXT files.'
        });
      }

      if (!documentProcessor.validateFileSize(size)) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.'
        });
      }

      // Process document
      const processResult = await documentProcessor.processDocument(path, originalname);
      
      if (!processResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process document',
          error: processResult.error
        });
      }

      // Extract key information
      const keyInfo = await documentProcessor.extractKeyInformation(processResult.content, 'project');

      // Get or create project
      let project = await Project.findOne().sort({ createdAt: -1 });
      
      if (!project) {
        project = new Project({
          name: 'Project from Document',
          description: keyInfo.summary || processResult.content.substring(0, 500),
          goals: keyInfo.keyPoints.map(point => ({
            title: point.substring(0, 50),
            description: point,
            priority: 'medium'
          }))
        });
      }

      // Add attachment
      project.attachments.push({
        filename: originalname,
        originalName: originalname,
        path: path,
        size: size
      });

      // Update project description if it's empty
      if (!project.description || project.description === 'Project from Document') {
        project.description = keyInfo.summary || processResult.content.substring(0, 500);
      }

      await project.save();

      res.json({
        success: true,
        message: 'Document uploaded and processed successfully',
        data: {
          project,
          documentInfo: {
            content: processResult.content,
            keyInfo,
            metadata: processResult.metadata
          }
        }
      });
    } catch (error) {
      console.error('Upload project document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload and process document',
        error: error.message
      });
    }
  }

  // Get project context for AI
  async getProjectContext(req, res) {
    try {
      const project = await Project.findOne().sort({ createdAt: -1 });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'No project found'
        });
      }

      // Build context string
      const context = [
        `Project: ${project.name}`,
        `Description: ${project.description}`,
        `Status: ${project.status}`,
        `Goals: ${project.goals.map(g => `${g.title} (${g.priority}): ${g.description}`).join('; ')}`,
        `Timeline: ${project.timeline.quarter || 'Not specified'}`,
        `Tags: ${project.tags.join(', ')}`
      ].join('\n');

      res.json({
        success: true,
        context,
        project
      });
    } catch (error) {
      console.error('Get project context error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get project context',
        error: error.message
      });
    }
  }

  // Update project goals
  async updateProjectGoals(req, res) {
    try {
      const { goals } = req.body;

      if (!Array.isArray(goals)) {
        return res.status(400).json({
          success: false,
          message: 'Goals must be an array'
        });
      }

      const project = await Project.findOne().sort({ createdAt: -1 });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'No project found'
        });
      }

      project.goals = goals;
      await project.save();

      res.json({
        success: true,
        message: 'Project goals updated successfully',
        data: project
      });
    } catch (error) {
      console.error('Update project goals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project goals',
        error: error.message
      });
    }
  }

  // Update project timeline
  async updateProjectTimeline(req, res) {
    try {
      const { timeline } = req.body;

      const project = await Project.findOne().sort({ createdAt: -1 });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'No project found'
        });
      }

      project.timeline = { ...project.timeline, ...timeline };
      await project.save();

      res.json({
        success: true,
        message: 'Project timeline updated successfully',
        data: project
      });
    } catch (error) {
      console.error('Update project timeline error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project timeline',
        error: error.message
      });
    }
  }

  // Delete project
  async deleteProject(req, res) {
    try {
      const project = await Project.findOne().sort({ createdAt: -1 });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'No project found'
        });
      }

      await Project.findByIdAndDelete(project._id);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message
      });
    }
  }

  // Get project statistics
  async getProjectStats(req, res) {
    try {
      let project;
      try {
        project = await Project.findOne().sort({ createdAt: -1 });
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        return res.json({
          success: true,
          data: {
            totalGoals: 0,
            highPriorityGoals: 0,
            totalAttachments: 0,
            projectAge: 0,
            status: 'none',
            tags: 0,
            connectionIssue: true
          }
        });
      }
      
      if (!project) {
        return res.json({
          success: true,
          data: {
            totalGoals: 0,
            highPriorityGoals: 0,
            totalAttachments: 0,
            projectAge: 0,
            status: 'none',
            tags: 0,
            noProject: true
          }
        });
      }

      const stats = {
        totalGoals: project.goals.length,
        highPriorityGoals: project.goals.filter(g => g.priority === 'high' || g.priority === 'critical').length,
        totalAttachments: project.attachments.length,
        projectAge: Math.floor((Date.now() - project.createdAt) / (1000 * 60 * 60 * 24)), // days
        status: project.status,
        tags: project.tags.length
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get project stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get project statistics',
        error: error.message
      });
    }
  }
}

module.exports = new ProjectController(); 