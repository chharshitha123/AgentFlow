const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a new agent
// @route   POST /api/agents
// @access  Private/Admin
router.post('/', [
  protect,
  admin,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('mobile').notEmpty().withMessage('Mobile number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobile, password } = req.body;

    // Check if agent already exists
    const agentExists = await User.findOne({ email });
    if (agentExists) {
      return res.status(400).json({
        message: 'Agent already exists with this email'
      });
    }

    // Create agent
    const agent = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'agent'
    });

    // Return agent data without password
    res.status(201).json({
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      mobile: agent.mobile,
      role: agent.role,
      message: 'Agent created successfully'
    });

  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({
      message: 'Server error while creating agent'
    });
  }
});

// @desc    Get all agents
// @route   GET /api/agents
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      agents,
      count: agents.length
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      message: 'Server error while fetching agents'
    });
  }
});

// @desc    Get agent by ID
// @route   GET /api/agents/:id
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const agent = await User.findOne({ 
      _id: req.params.id, 
      role: 'agent' 
    }).select('-password');

    if (!agent) {
      return res.status(404).json({
        message: 'Agent not found'
      });
    }

    res.json(agent);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      message: 'Server error while fetching agent'
    });
  }
});

module.exports = router;