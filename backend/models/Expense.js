const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
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
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Expense title / description is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Travel & Commute', 'Client Entertainment', 'Office Supplies & Hardware', 'Internet & Phone', 'Health & Wellness', 'Learning & Books', 'Other'],
      default: 'Other',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Expense claim amount is required'],
      min: [1, 'Amount must be greater than 0']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    expenseDate: {
      type: Date,
      required: [true, 'Date of expense occurrence is required']
    },
    receiptUrl: {
      type: String,
      default: ''
    },
    receiptName: {
      type: String,
      default: 'receipt.pdf'
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Reimbursed'],
      default: 'Pending',
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    adminRemarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ employeeId: 1, status: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
