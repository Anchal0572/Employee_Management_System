const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement headline is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Announcement description is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['General', 'Holiday & Off', 'Policy Update', 'Townhall & Event', 'Celebration'],
      default: 'General',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Normal', 'High', 'Urgent'],
      default: 'Normal',
      index: true
    },
    pinned: {
      type: Boolean,
      default: false
    },
    authorName: {
      type: String,
      default: 'People Operations Team'
    },
    authorRole: {
      type: String,
      default: 'HR Management'
    },
    department: {
      type: String,
      default: 'All Departments'
    }
  },
  {
    timestamps: true
  }
);

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
