const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'employee', 'all'],
      default: 'employee'
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['leave', 'employee', 'attendance', 'payroll', 'system'],
      default: 'system',
      index: true
    },
    link: {
      type: String,
      default: '/notifications'
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
