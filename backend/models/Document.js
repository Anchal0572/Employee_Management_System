const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
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
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: ['Offer Letter', 'Identity Proof', 'NDA & Legal', 'Appraisal', 'Certification', 'Tax Document', 'Other'],
      default: 'Other',
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: String,
      default: '500 KB'
    },
    fileUrl: {
      type: String,
      default: ''
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    status: {
      type: String,
      enum: ['Verified', 'Pending Review', 'Archived'],
      default: 'Verified'
    },
    uploadedBy: {
      type: String,
      default: 'System Admin'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

documentSchema.index({ employeeId: 1, category: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
