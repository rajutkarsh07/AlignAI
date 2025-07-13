const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Project = require('../models/Project');
const aiService = require('../services/aiService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/projects';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
  }
});

// @route   GET /api/projects
// @desc    Get all projects
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive = true } = req.query;
    
    const query = { isActive };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const projects = await Project.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-officialPlan -formattedPlan'); // Exclude large fields from list view
    
    const total = await Project.countDocuments(query);
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, description, officialPlan, goals, metadata } = req.body;
    
    // Validate required fields
    if (!name || !description || !officialPlan) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and official plan are required'
      });
    }
    
    // Try to format the official plan using AI, but don't fail if AI is unavailable
    let formattedPlan = officialPlan; // fallback to original plan
    try {
      formattedPlan = await aiService.formatProjectPlan(officialPlan);
    } catch (error) {
      console.warn('AI formatting failed, using original plan:', error.message);
      // Continue with original plan as formatted plan
    }
    
    const project = new Project({
      name,
      description,
      officialPlan,
      formattedPlan,
      goals: goals || [],
      metadata: metadata || {}
    });
    
    const savedProject = await project.save();
    
    res.status(201).json({
      success: true,
      data: savedProject,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// @route   POST /api/projects/upload
// @desc    Create project from uploaded document
// @access  Public
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }
    
    // Try to extract text from uploaded document, fallback to basic text if AI fails
    let extractedText = 'Document uploaded successfully. AI text extraction temporarily unavailable.';
    let formattedPlan = extractedText;
    
    try {
      const fileBuffer = await fs.readFile(req.file.path);
      extractedText = await aiService.extractTextFromDocument(fileBuffer, req.file.mimetype);
      
      // Try to format the extracted text into a structured plan
      try {
        formattedPlan = await aiService.formatProjectPlan(extractedText);
      } catch (formatError) {
        console.warn('AI formatting failed, using extracted text:', formatError.message);
        formattedPlan = extractedText;
      }
    } catch (extractError) {
      console.warn('AI text extraction failed:', extractError.message);
      // Use fallback text
    }
    
    const project = new Project({
      name,
      description,
      officialPlan: extractedText,
      formattedPlan
    });
    
    const savedProject = await project.save();
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    
    res.status(201).json({
      success: true,
      data: savedProject,
      message: 'Project created from document successfully'
    });
  } catch (error) {
    console.error('Error creating project from upload:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create project from document'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { name, description, officialPlan, goals, metadata } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Update fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (goals) project.goals = goals;
    if (metadata) project.metadata = { ...project.metadata, ...metadata };
    
    // If official plan is updated, reformat it
    if (officialPlan && officialPlan !== project.officialPlan) {
      project.officialPlan = officialPlan;
      project.formattedPlan = await aiService.formatProjectPlan(officialPlan);
      project.version += 1;
    }
    
    const updatedProject = await project.save();
    
    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project (soft delete)
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    project.isActive = false;
    await project.save();
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

// @route   POST /api/projects/:id/goals
// @desc    Add goal to project
// @access  Public
router.post('/:id/goals', async (req, res) => {
  try {
    const { title, description, priority, targetQuarter, status } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required for goals'
      });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    project.goals.push({
      title,
      description,
      priority: priority || 'medium',
      targetQuarter,
      status: status || 'planned'
    });
    
    const updatedProject = await project.save();
    
    res.json({
      success: true,
      data: updatedProject,
      message: 'Goal added successfully'
    });
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add goal'
    });
  }
});

// @route   PUT /api/projects/:id/goals/:goalId
// @desc    Update project goal
// @access  Public
router.put('/:id/goals/:goalId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const goal = project.goals.id(req.params.goalId);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }
    
    // Update goal fields
    Object.assign(goal, req.body);
    
    const updatedProject = await project.save();
    
    res.json({
      success: true,
      data: updatedProject,
      message: 'Goal updated successfully'
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update goal'
    });
  }
});

// @route   DELETE /api/projects/:id/goals/:goalId
// @desc    Delete project goal
// @access  Public
router.delete('/:id/goals/:goalId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    project.goals.id(req.params.goalId).remove();
    const updatedProject = await project.save();
    
    res.json({
      success: true,
      data: updatedProject,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete goal'
    });
  }
});

module.exports = router;
