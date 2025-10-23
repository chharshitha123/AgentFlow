const mongoose = require('mongoose');

const listItemSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-]+$/, 'Please add a valid phone number']
  },
  notes: {
    type: String,
    trim: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  distributionBatch: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const listDistributionSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  totalRecords: {
    type: Number,
    required: true
  },
  distributedRecords: {
    type: Number,
    required: true
  },
  distributionBatch: {
    type: String,
    required: true,
    unique: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = {
  ListItem: mongoose.model('ListItem', listItemSchema),
  ListDistribution: mongoose.model('ListDistribution', listDistributionSchema)
};