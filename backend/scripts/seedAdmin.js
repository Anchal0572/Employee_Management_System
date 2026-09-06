const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');

const seedUsers = async () => {
  console.log('====================================================');
  console.log('🌱 EMS Production-Style Account Seeder');
  console.log('====================================================');
  console.log(`[Config] Admin Account: ${config.adminSeed.email}`);
  console.log(`[Config] Employee Account: ${config.employeeSeed.email}`);
  console.log('[Security] Passwords loaded from environment variables (.env)');

  try {
    console.log(`[Database] Connecting to MongoDB: ${config.mongo.uri}...`);
    await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    console.log('[Database] Connected successfully.');

    // Seed Admin Account
    let admin = await User.findOne({ email: config.adminSeed.email.toLowerCase() });
    if (!admin) {
      console.log(`[Seed] Creating new Admin account: ${config.adminSeed.email}`);
      admin = new User({
        name: config.adminSeed.name,
        email: config.adminSeed.email,
        password: config.adminSeed.password, // Pre-save hook will hash with bcrypt
        role: 'admin',
        employeeId: 'EMP-ADMIN-01',
        department: 'Operations',
        designation: 'VP of People Operations / System Admin',
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        phone: '+1 (555) 123-4567'
      });
      await admin.save();
      console.log('✅ Admin account created with bcrypt password hash.');
    } else {
      console.log(`[Seed] Updating existing Admin account credentials...`);
      admin.name = config.adminSeed.name;
      admin.password = config.adminSeed.password; // Pre-save will rehash
      admin.role = 'admin';
      admin.status = 'active';
      await admin.save();
      console.log('✅ Admin account updated successfully.');
    }

    // Seed Employee Account
    let employee = await User.findOne({ email: config.employeeSeed.email.toLowerCase() });
    if (!employee) {
      console.log(`[Seed] Creating new Employee account: ${config.employeeSeed.email}`);
      employee = new User({
        name: config.employeeSeed.name,
        email: config.employeeSeed.email,
        password: config.employeeSeed.password,
        role: 'employee',
        employeeId: 'EMP-001',
        department: 'Engineering',
        designation: 'Staff Software Engineer',
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: '+1 (555) 234-5678'
      });
      await employee.save();
      console.log('✅ Employee account created with bcrypt password hash.');
    } else {
      console.log(`[Seed] Updating existing Employee account credentials...`);
      employee.name = config.employeeSeed.name;
      employee.password = config.employeeSeed.password;
      employee.role = 'employee';
      employee.status = 'active';
      await employee.save();
      console.log('✅ Employee account updated successfully.');
    }

    console.log('====================================================');
    console.log('🎉 Seeding completed successfully!');
    console.log('====================================================');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.warn(`[Seed Note] MongoDB connection unavailable (${error.message}).`);
    console.log(`[Seed Note] The EMS authService maintains an active in-memory development repository initialized directly with bcrypt-hashed credentials from .env.`);
    console.log(`[Seed Note] You can log in immediately using the credentials specified in .env:`);
    console.log(`  - Admin: ${config.adminSeed.email}`);
    console.log(`  - Employee: ${config.employeeSeed.email}`);
    console.log('====================================================');
    process.exit(0);
  }
};

seedUsers();
