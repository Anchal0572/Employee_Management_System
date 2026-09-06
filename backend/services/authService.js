const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getDbStatus } = require('../config/db');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * In-memory development repository for fallback when local MongoDB daemon is offline.
 * Initialized with bcrypt-hashed passwords using work factor 10.
 */
class DevMemoryUserStore {
  constructor() {
    this.users = new Map();
    this.initDefaultUsers();
  }

  initDefaultUsers() {
    const adminSalt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync(config.adminSeed.password, adminSalt);

    const empSalt = bcrypt.genSaltSync(10);
    const empHash = bcrypt.hashSync(config.employeeSeed.password, empSalt);

    const adminUser = {
      _id: '66e1a0000000000000000001',
      name: config.adminSeed.name,
      email: config.adminSeed.email.toLowerCase(),
      password: adminHash,
      role: 'admin',
      employeeId: 'EMP-ADMIN-01',
      department: 'Operations',
      designation: 'VP of People Operations / System Admin',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      phone: '+1 (555) 123-4567',
      lastLogin: new Date(),
      createdAt: new Date()
    };

    const employeeUser = {
      _id: '66e1a0000000000000000002',
      name: config.employeeSeed.name,
      email: config.employeeSeed.email.toLowerCase(),
      password: empHash,
      role: 'employee',
      employeeId: 'EMP-001',
      department: 'Engineering',
      designation: 'Staff Software Engineer',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '+1 (555) 234-5678',
      lastLogin: new Date(),
      createdAt: new Date()
    };

    this.users.set(adminUser.email, adminUser);
    this.users.set(employeeUser.email, employeeUser);
  }

  findByEmail(email) {
    return this.users.get(email.toLowerCase()) || null;
  }

  findById(id) {
    for (const user of this.users.values()) {
      if (user._id.toString() === id.toString()) {
        return user;
      }
    }
    return null;
  }

  save(user) {
    this.users.set(user.email.toLowerCase(), user);
    return user;
  }
}

const devStore = new DevMemoryUserStore();

class AuthService {
  /**
   * Helper to generate signed JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn
      }
    );
  }

  /**
   * Helper to sanitize user output (never return password)
   */
  sanitizeUser(user) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      department: user.department,
      designation: user.designation,
      status: user.status,
      avatar: user.avatar,
      phone: user.phone,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
  }

  /**
   * Authenticate user with email and password
   */
  async loginUser({ email, password }) {
    if (!email || !password) {
      throw ApiError.badRequest('Please provide both email and password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isDbConnected = getDbStatus().isConnected;

    let user;

    if (isDbConnected) {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    } else {
      user = devStore.findByEmail(normalizedEmail);
    }

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify bcrypt password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('Account is currently inactive or suspended. Please contact HR.');
    }

    // Update last login
    user.lastLogin = new Date();
    if (isDbConnected) {
      await user.save();
    } else {
      devStore.save(user);
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Retrieve current authenticated user profile
   */
  async getUserProfile(userId) {
    const isDbConnected = getDbStatus().isConnected;
    let user;

    if (isDbConnected) {
      user = await User.findById(userId);
    } else {
      user = devStore.findById(userId);
    }

    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Change password for authenticated user
   */
  async changeUserPassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Please provide both current and new password');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters in length');
    }

    const isDbConnected = getDbStatus().isConnected;
    let user;

    if (isDbConnected) {
      user = await User.findById(userId).select('+password');
    } else {
      user = devStore.findById(userId);
    }

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check old password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw ApiError.badRequest('Current password provided is incorrect');
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    if (isDbConnected) {
      await user.save();
    } else {
      devStore.save(user);
    }

    return {
      success: true,
      message: 'Password updated successfully'
    };
  }

  /**
   * Resolve user document by ID (used by auth middleware)
   */
  async findUserById(userId) {
    const isDbConnected = getDbStatus().isConnected;
    if (isDbConnected) {
      return await User.findById(userId);
    }
    return devStore.findById(userId);
  }
}

module.exports = new AuthService();
