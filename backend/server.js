const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const seedAdmin = require('./config/dbSeeder');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/lists', require('./routes/lists')); // Add this line

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'MERN Assignment Server is running!' });
});

// Database connection - Remove deprecated options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_assignment')
.then(() => {
  console.log('✅ MongoDB connected successfully');
  // Seed admin user after DB connection
  seedAdmin();
})
.catch(err => console.log('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Agent routes: http://localhost:${PORT}/api/agents`);
  console.log(`📊 List routes: http://localhost:${PORT}/api/lists`); // Add this line
});