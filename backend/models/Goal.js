const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      index: true
    },
    employeeName: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Goal / OKR title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
      default: 'Q1'
    },
    year: {
      type: Number,
      default: 2026
    },
    targetMetric: {
      type: String,
      default: '100%'
    },
    currentMetric: {
      type: String,
      default: '75%'
    },
    progressPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ['On Track', 'In Progress', 'Behind', 'Completed'],
      default: 'On Track',
      index: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.5
    },
    managerFeedback: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

goalSchema.index({ employeeId: 1, quarter: 1, year: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
