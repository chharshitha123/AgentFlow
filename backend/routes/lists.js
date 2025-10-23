const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { protect, admin } = require('../middleware/auth');
const { ListItem, ListDistribution } = require('../models/List');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only CSV and Excel files
  if (file.mimetype === 'text/csv' || 
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  }
});

// @desc    Upload CSV and distribute to agents
// @route   POST /api/lists/upload
// @access  Private/Admin
router.post('/upload', protect, admin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const results = [];
    const errors = [];

    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Validate required fields
        if (!data.FirstName || !data.Phone) {
          errors.push(`Missing required fields in row: ${JSON.stringify(data)}`);
          return;
        }
        
        // Validate phone number format
        const phoneRegex = /^\+?[\d\s-]+$/;
        if (!phoneRegex.test(data.Phone)) {
          errors.push(`Invalid phone number format: ${data.Phone}`);
          return;
        }

        results.push({
          firstName: data.FirstName.trim(),
          phone: data.Phone.trim(),
          notes: data.Notes ? data.Notes.trim() : ''
        });
      })
      .on('end', async () => {
        try {
          if (results.length === 0) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
            return res.status(400).json({ 
              message: 'No valid data found in CSV file',
              errors: errors 
            });
          }

          // Get all active agents
          const agents = await User.find({ role: 'agent' }).select('_id');
          
          if (agents.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
              message: 'No agents found. Please create agents first.' 
            });
          }

          // Create distribution batch ID
          const distributionBatch = `BATCH-${Date.now()}`;

          // Distribute items equally among agents
          const itemsPerAgent = Math.floor(results.length / agents.length);
          let remainingItems = results.length % agents.length;

          let distributedItems = [];
          let currentIndex = 0;

          for (let i = 0; i < agents.length; i++) {
            let agentItemCount = itemsPerAgent;
            
            // Distribute remaining items to first few agents
            if (remainingItems > 0) {
              agentItemCount++;
              remainingItems--;
            }

            const agentItems = results.slice(currentIndex, currentIndex + agentItemCount);
            
            // Create list items for this agent
            const agentListItems = agentItems.map(item => ({
              ...item,
              agent: agents[i]._id,
              distributionBatch: distributionBatch
            }));

            distributedItems.push(...agentListItems);
            currentIndex += agentItemCount;
          }

          // Save to database
          await ListItem.insertMany(distributedItems);

          // Create distribution record
          const distributionRecord = await ListDistribution.create({
            fileName: req.file.filename,
            originalName: req.file.originalname,
            totalRecords: results.length,
            distributedRecords: distributedItems.length,
            distributionBatch: distributionBatch,
            uploadedBy: req.user._id
          });

          // Delete the uploaded file after processing
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'File uploaded and distributed successfully',
            distribution: {
              batchId: distributionBatch,
              totalRecords: results.length,
              distributedRecords: distributedItems.length,
              agentsCount: agents.length,
              fileName: req.file.originalname
            },
            errors: errors.length > 0 ? errors : undefined
          });

        } catch (error) {
          // Clean up file if error occurs
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          console.error('Distribution error:', error);
          res.status(500).json({ 
            message: 'Error during distribution process' 
          });
        }
      })
      .on('error', (error) => {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error('CSV parsing error:', error);
        res.status(500).json({ 
          message: 'Error parsing CSV file' 
        });
      });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Server error during file upload' 
    });
  }
});

// @desc    Get distributed lists
// @route   GET /api/lists
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const distributions = await ListDistribution.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      distributions,
      count: distributions.length
    });
  } catch (error) {
    console.error('Get distributions error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching distributions' 
    });
  }
});

// @desc    Get list items by distribution batch
// @route   GET /api/lists/batch/:batchId
// @access  Private/Admin
router.get('/batch/:batchId', protect, admin, async (req, res) => {
  try {
    const { batchId } = req.params;

    const listItems = await ListItem.find({ distributionBatch: batchId })
      .populate('agent', 'name email mobile')
      .sort({ agent: 1 });

    // Group by agent for better visualization
    const groupedByAgent = {};
    listItems.forEach(item => {
      const agentId = item.agent._id.toString();
      if (!groupedByAgent[agentId]) {
        groupedByAgent[agentId] = {
          agent: item.agent,
          items: []
        };
      }
      groupedByAgent[agentId].items.push(item);
    });

    res.json({
      batchId,
      items: listItems,
      groupedByAgent: Object.values(groupedByAgent),
      totalItems: listItems.length
    });
  } catch (error) {
    console.error('Get batch items error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching batch items' 
    });
  }
});

// @desc    Get agent's assigned lists
// @route   GET /api/lists/agent
// @access  Private/Agent
router.get('/agent/my-lists', protect, async (req, res) => {
  try {
    // For agents, only show their own assigned lists
    const listItems = await ListItem.find({ agent: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      items: listItems,
      totalItems: listItems.length
    });
  } catch (error) {
    console.error('Get agent lists error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching your lists' 
    });
  }
});

module.exports = router;