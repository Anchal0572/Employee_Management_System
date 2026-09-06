const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true
    },
    checkIn: {
      type: Date
    },
    checkOut: {
      type: Date
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Holiday'],
        message: '{VALUE} is not a valid attendance status'
      },
      default: 'Present',
      index: true
    },
    workingHours: {
      type: Number,
      default: 0,
      min: [0, 'Working hours cannot be negative']
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    shift: {
      type: String,
      default: 'Standard Shift (09:00 - 18:00)'
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    location: {
      type: String,
      default: 'Office HQ - Main Tower'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Unique compound index: One attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Pre-save hook: auto-compute workingHours if checkIn and checkOut exist
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = new Date(this.checkOut) - new Date(this.checkIn);
    if (diffMs >= 0) {
      const hours = diffMs / (1000 * 60 * 60);
      this.workingHours = parseFloat(hours.toFixed(2));
      // Auto-classify Half Day if working hours are below 4 hours and status was Present/Late
      if (this.workingHours < 4 && (this.status === 'Present' || this.status === 'Late')) {
        this.status = 'Half Day';
      }
    }
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
