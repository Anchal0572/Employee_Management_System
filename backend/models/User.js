const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        'Please provide a valid corporate email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'employee'],
        message: '{VALUE} is not a supported EMS role'
      },
      default: 'employee'
    },
    employeeId: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      default: 'Engineering'
    },
    designation: {
      type: String,
      default: 'Staff Member'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    phone: {
      type: String,
      default: '+1 (555) 000-0000'
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: Hash password with bcrypt before saving document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate signed JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn
    }
  );
};

// Return sanitized user object
userSchema.methods.toSanitizedObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    employeeId: this.employeeId,
    department: this.department,
    designation: this.designation,
    status: this.status,
    avatar: this.avatar,
    phone: this.phone,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
