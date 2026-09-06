const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID string is required'],
      index: true
    },
    employeeName: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true,
      index: true
    },
    leaveType: {
      type: String,
      enum: {
        values: ['Casual', 'Sick', 'Earned', 'Emergency', 'Other'],
        message: '{VALUE} is not a valid leave type'
      },
      required: [true, 'Leave type is required'],
      index: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    totalDays: {
      type: Number,
      required: true,
      min: [1, 'Leave must be at least 1 day']
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave application is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        message: '{VALUE} is not a valid leave status'
      },
      default: 'Pending',
      index: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewerName: {
      type: String,
      trim: true
    },
    adminComment: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for querying employee leave periods
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });

// Pre-validate hook: ensure startDate <= endDate and compute totalDays
leaveSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (start > end) {
      return next(new Error('Start date cannot be after end date'));
    }
    const diffMs = end - start;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    this.totalDays = Math.max(1, days);
  }
  next();
});

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
