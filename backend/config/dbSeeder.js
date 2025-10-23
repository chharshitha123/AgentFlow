const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@mern.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@mern.com',
        mobile: '+1234567890',
        password: 'admin123', // Will be hashed automatically
        role: 'admin'
      });
      console.log('✅ Default admin user created: admin@mern.com / admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
  }
};

module.exports = seedAdmin;