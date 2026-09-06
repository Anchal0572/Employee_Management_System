const mongoose = require('mongoose');

const allowancesSchema = new mongoose.Schema(
  {
    hra: { type: Number, default: 0, min: 0 },
    transportAllowance: { type: Number, default: 0, min: 0 },
    medicalAllowance: { type: Number, default: 0, min: 0 },
    specialAllowance: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const deductionsSchema = new mongoose.Schema(
  {
    providentFund: { type: Number, default: 0, min: 0 },
    professionalTax: { type: Number, default: 0, min: 0 },
    healthInsurance: { type: Number, default: 0, min: 0 },
    loanDeduction: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      index: true
    },
    employeeName: {
      type: String,
      trim: true,
      required: [true, 'Employee name is required']
    },
    department: {
      type: String,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    bankAccount: {
      type: String,
      trim: true,
      default: '•••• •••• •••• 0000'
    },
    salaryMonth: {
      type: String,
      required: [true, 'Salary month is required'],
      // Format: "YYYY-MM" e.g. "2025-05"
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'salaryMonth must be in YYYY-MM format'],
      index: true
    },
    // Core salary components
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary cannot be negative']
    },
    allowances: {
      type: allowancesSchema,
      default: () => ({})
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, 'Bonus cannot be negative']
    },
    deductions: {
      type: deductionsSchema,
      default: () => ({})
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
      comment: 'Income tax / TDS withheld at source'
    },
    // Computed totals (stored for audit trail)
    totalAllowances: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    grossSalary: {
      type: Number,
      required: true,
      min: [0, 'Gross salary cannot be negative'],
      comment: 'basicSalary + totalAllowances + bonus'
    },
    netSalary: {
      type: Number,
      required: true,
      min: [0, 'Net salary cannot be negative'],
      comment: 'grossSalary - totalDeductions - tax'
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['Draft', 'Processing', 'Paid', 'Failed', 'Cancelled'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'Draft',
      index: true
    },
    paymentDate: {
      type: Date,
      default: null
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    generatedByName: {
      type: String,
      trim: true
    },
    notes: {
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

// Compound unique index: one payslip per employee per month
payslipSchema.index({ employeeId: 1, salaryMonth: 1 }, { unique: true });

// Pre-save hook: validate and recompute totals for data consistency
payslipSchema.pre('save', function (next) {
  // Recompute totalAllowances
  const a = this.allowances || {};
  this.totalAllowances =
    (a.hra || 0) +
    (a.transportAllowance || 0) +
    (a.medicalAllowance || 0) +
    (a.specialAllowance || 0);

  // Recompute totalDeductions
  const d = this.deductions || {};
  this.totalDeductions =
    (d.providentFund || 0) +
    (d.professionalTax || 0) +
    (d.healthInsurance || 0) +
    (d.loanDeduction || 0);

  // Recompute grossSalary
  this.grossSalary = (this.basicSalary || 0) + this.totalAllowances + (this.bonus || 0);

  // Recompute netSalary
  this.netSalary = Math.max(0, this.grossSalary - this.totalDeductions - (this.tax || 0));

  next();
});

const Payslip = mongoose.model('Payslip', payslipSchema);

module.exports = Payslip;
