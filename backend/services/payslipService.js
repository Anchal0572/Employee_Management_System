const { getDbStatus } = require('../config/db');
const Payslip = require('../models/Payslip');
const ApiError = require('../utils/apiError');
const notificationService = require('./notificationService');
const eventDispatcher = require('../jobs/eventDispatcher');

// ─────────────────────────────────────────────────────────────────────────────
// SALARY CALCULATION ENGINE
// All authoritative payroll calculations are performed exclusively in this
// service. React components must never compute final salary values.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate allowances from basic salary using standard ratios
 * @param {number} basicSalary
 * @param {object} overrides - optional manual allowance values
 */
const calculateAllowances = (basicSalary, overrides = {}) => {
  return {
    hra: overrides.hra ?? Math.round(basicSalary * 0.20),               // 20% of basic
    transportAllowance: overrides.transportAllowance ?? Math.round(basicSalary * 0.05), // 5%
    medicalAllowance: overrides.medicalAllowance ?? Math.round(basicSalary * 0.03),    // 3%
    specialAllowance: overrides.specialAllowance ?? Math.round(basicSalary * 0.10)     // 10%
  };
};

/**
 * Calculate deductions from basic salary using standard rates
 * @param {number} basicSalary
 * @param {object} overrides - optional manual deduction values
 */
const calculateDeductions = (basicSalary, overrides = {}) => {
  return {
    providentFund: overrides.providentFund ?? Math.round(basicSalary * 0.12),       // 12% PF
    professionalTax: overrides.professionalTax ?? 200,                               // flat $200
    healthInsurance: overrides.healthInsurance ?? Math.round(basicSalary * 0.015),   // 1.5%
    loanDeduction: overrides.loanDeduction ?? 0                                       // optional
  };
};

/**
 * Calculate income tax using progressive tax brackets (simplified US-style)
 * @param {number} grossSalary - annual equivalent (monthly * 12)
 * @returns {number} monthly tax amount
 */
const calculateTax = (grossSalary, overrideAnnualTax) => {
  if (overrideAnnualTax !== undefined && overrideAnnualTax !== null) {
    return Math.round(overrideAnnualTax / 12);
  }
  const annualGross = grossSalary * 12;
  let annualTax = 0;

  if (annualGross <= 11600) {
    annualTax = annualGross * 0.10;
  } else if (annualGross <= 47150) {
    annualTax = 1160 + (annualGross - 11600) * 0.12;
  } else if (annualGross <= 100525) {
    annualTax = 5426 + (annualGross - 47150) * 0.22;
  } else if (annualGross <= 191950) {
    annualTax = 17168.5 + (annualGross - 100525) * 0.24;
  } else if (annualGross <= 243725) {
    annualTax = 39110.5 + (annualGross - 191950) * 0.32;
  } else {
    annualTax = 55678.5 + (annualGross - 243725) * 0.35;
  }

  return Math.round(annualTax / 12);
};

/**
 * Core computation: given inputs, produce all payslip totals
 * @returns {object} { allowances, deductions, totalAllowances, totalDeductions, grossSalary, netSalary, tax }
 */
const computePayslipTotals = ({
  basicSalary,
  bonus = 0,
  allowancesOverride = {},
  deductionsOverride = {},
  taxOverride = undefined
}) => {
  const allowances = calculateAllowances(basicSalary, allowancesOverride);
  const deductions = calculateDeductions(basicSalary, deductionsOverride);

  const totalAllowances =
    allowances.hra +
    allowances.transportAllowance +
    allowances.medicalAllowance +
    allowances.specialAllowance;

  const totalDeductions =
    deductions.providentFund +
    deductions.professionalTax +
    deductions.healthInsurance +
    deductions.loanDeduction;

  const grossSalary = basicSalary + totalAllowances + bonus;
  const tax = calculateTax(grossSalary, taxOverride);
  const netSalary = Math.max(0, grossSalary - totalDeductions - tax);

  return {
    allowances,
    deductions,
    totalAllowances,
    totalDeductions,
    grossSalary,
    tax,
    netSalary
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY DEVELOPMENT STORE
// ─────────────────────────────────────────────────────────────────────────────

const SEED_EMPLOYEES = [
  { employeeId: 'EMP-001', employeeName: 'Sophia Chen', department: 'Engineering', designation: 'Staff Software Engineer', basicSalary: 11250, bankAccount: '•••• •••• •••• 4892 (Chase Bank)' },
  { employeeId: 'EMP-002', employeeName: 'Marcus Vance', department: 'Human Resources', designation: 'Director of Human Resources', basicSalary: 12083, bankAccount: '•••• •••• •••• 9921 (Wells Fargo)' },
  { employeeId: 'EMP-003', employeeName: 'Elena Rostova', department: 'Finance', designation: 'Financial Controller', basicSalary: 10000, bankAccount: '•••• •••• •••• 1234 (Bank of America)' },
  { employeeId: 'EMP-004', employeeName: 'David Kim', department: 'Product', designation: 'Principal Product Manager', basicSalary: 11667, bankAccount: '•••• •••• •••• 5566 (Citibank)' },
  { employeeId: 'EMP-005', employeeName: 'Amara Okafor', department: 'Engineering', designation: 'Senior Backend Engineer', basicSalary: 10833, bankAccount: '•••• •••• •••• 7788 (Chase Bank)' },
  { employeeId: 'EMP-006', employeeName: 'Liam Gallagher', department: 'Human Resources', designation: 'HR Business Partner', basicSalary: 8333, bankAccount: '•••• •••• •••• 3344 (Wells Fargo)' },
  { employeeId: 'EMP-007', employeeName: 'Priya Nair', department: 'Product', designation: 'Senior UX Designer', basicSalary: 9583, bankAccount: '•••• •••• •••• 2211 (Bank of America)' },
  { employeeId: 'EMP-008', employeeName: 'Carlos Mendez', department: 'Legal', designation: 'Senior Corporate Counsel', basicSalary: 11500, bankAccount: '•••• •••• •••• 8899 (Citibank)' }
];

const SEED_MONTHS = ['2026-09', '2026-08', '2026-07'];

const generateSeedPayslips = () => {
  const payslips = [];
  let idCounter = 1;

  SEED_MONTHS.forEach((month, monthIdx) => {
    const [year, mo] = month.split('-');
    const paymentStatus = monthIdx === 0 ? 'Processing' : 'Paid';
    const paymentDate = monthIdx === 0 ? null : new Date(`${year}-${mo}-28`);

    SEED_EMPLOYEES.forEach((emp) => {
      const bonus = monthIdx === 0 ? (Math.random() > 0.7 ? Math.round(emp.basicSalary * 0.1) : 0) : 0;
      const computed = computePayslipTotals({ basicSalary: emp.basicSalary, bonus });

      const _id = `66e5a00000000000${idCounter.toString().padStart(8, '0')}`;
      idCounter++;

      payslips.push({
        _id,
        id: _id,
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        department: emp.department,
        designation: emp.designation,
        bankAccount: emp.bankAccount,
        salaryMonth: month,
        basicSalary: emp.basicSalary,
        bonus,
        ...computed,
        paymentStatus,
        paymentDate,
        generatedAt: new Date(`${year}-${mo}-01`),
        generatedByName: 'Anchal Keshri',
        notes: '',
        createdAt: new Date(`${year}-${mo}-01`),
        updatedAt: new Date(`${year}-${mo}-01`)
      });
    });
  });

  return payslips;
};

class DevMemoryPayslipStore {
  constructor() {
    this.payslips = new Map();
    this._counter = 100;
    const seed = generateSeedPayslips();
    seed.forEach((p) => this.payslips.set(p._id, { ...p }));
  }

  getAll() {
    return Array.from(this.payslips.values());
  }

  findById(id) {
    return this.payslips.get(id) || null;
  }

  findByEmployeeAndMonth(employeeId, salaryMonth) {
    for (const p of this.payslips.values()) {
      if (p.employeeId === employeeId && p.salaryMonth === salaryMonth) return p;
    }
    return null;
  }

  findByEmployee(employeeId) {
    return Array.from(this.payslips.values()).filter((p) => p.employeeId === employeeId);
  }

  create(record) {
    this._counter++;
    const _id = `66e5a00000000000${this._counter.toString().padStart(8, '0')}`;
    const now = new Date();
    const newRecord = { _id, id: _id, ...record, createdAt: now, updatedAt: now };
    this.payslips.set(_id, newRecord);
    return newRecord;
  }

  update(id, data) {
    const existing = this.payslips.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.payslips.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.payslips.delete(id);
  }
}

const devPayslipStore = new DevMemoryPayslipStore();

// ─────────────────────────────────────────────────────────────────────────────
// PAYSLIP SERVICE
// ─────────────────────────────────────────────────────────────────────────────

class PayslipService {
  /**
   * ADMIN: Generate a new payslip for an employee
   * All computation is performed in this service; the frontend sends raw inputs.
   */
  async generatePayslip({
    employeeId,
    employeeName,
    department,
    designation,
    bankAccount,
    salaryMonth,
    basicSalary,
    bonus = 0,
    allowancesOverride = {},
    deductionsOverride = {},
    taxOverride,
    notes = '',
    generatedBy,
    generatedByName
  }) {
    if (!employeeId || !salaryMonth || !basicSalary) {
      throw ApiError.badRequest('employeeId, salaryMonth and basicSalary are required');
    }

    // Validate salaryMonth format
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(salaryMonth)) {
      throw ApiError.badRequest('salaryMonth must be in YYYY-MM format (e.g. "2025-05")');
    }

    if (basicSalary < 0) {
      throw ApiError.badRequest('Basic salary cannot be negative');
    }

    const isDbConnected = getDbStatus().isConnected;

    // Duplicate check
    if (isDbConnected) {
      const existing = await Payslip.findOne({ employeeId, salaryMonth });
      if (existing) {
        throw ApiError.conflict(
          `A payslip for ${employeeName || employeeId} for ${salaryMonth} already exists. Delete it first to regenerate.`
        );
      }
    } else {
      const existing = devPayslipStore.findByEmployeeAndMonth(employeeId, salaryMonth);
      if (existing) {
        throw ApiError.conflict(
          `A payslip for ${employeeName || employeeId} for ${salaryMonth} already exists.`
        );
      }
    }

    // Compute all salary values server-side
    const computed = computePayslipTotals({ basicSalary, bonus, allowancesOverride, deductionsOverride, taxOverride });

    const payslipData = {
      employeeId,
      employeeName: employeeName || employeeId,
      department: department || 'N/A',
      designation: designation || 'N/A',
      bankAccount: bankAccount || '•••• •••• •••• 0000',
      salaryMonth,
      basicSalary,
      bonus,
      allowances: computed.allowances,
      deductions: computed.deductions,
      totalAllowances: computed.totalAllowances,
      totalDeductions: computed.totalDeductions,
      grossSalary: computed.grossSalary,
      tax: computed.tax,
      netSalary: computed.netSalary,
      paymentStatus: 'Draft',
      generatedAt: new Date(),
      generatedBy: generatedBy || null,
      generatedByName: generatedByName || 'System',
      notes
    };

    let payslip;
    if (isDbConnected) {
      payslip = await Payslip.create(payslipData);
    } else {
      payslip = devPayslipStore.create(payslipData);
    }

    // Event-driven asynchronous notification & payslip ready email
    eventDispatcher.payslipGenerated(payslip, {
      name: employeeName,
      employeeId,
      department
    });

    return payslip;
  }

  /**
   * ADMIN: Get all payslips with optional filters
   */
  async getAdminPayslips({ salaryMonth, employeeId, paymentStatus, page = 1, limit = 20 } = {}) {
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      const filter = {};
      if (salaryMonth) filter.salaryMonth = salaryMonth;
      if (employeeId) filter.employeeId = employeeId;
      if (paymentStatus) filter.paymentStatus = paymentStatus;

      const skip = (page - 1) * limit;
      const [payslips, total] = await Promise.all([
        Payslip.find(filter).sort({ salaryMonth: -1, createdAt: -1 }).skip(skip).limit(limit),
        Payslip.countDocuments(filter)
      ]);

      return { payslips, total, page, limit, pages: Math.ceil(total / limit) };
    } else {
      let all = devPayslipStore.getAll();

      if (salaryMonth) all = all.filter((p) => p.salaryMonth === salaryMonth);
      if (employeeId) all = all.filter((p) => p.employeeId === employeeId);
      if (paymentStatus) all = all.filter((p) => p.paymentStatus === paymentStatus);

      all.sort((a, b) => {
        if (b.salaryMonth !== a.salaryMonth) return b.salaryMonth.localeCompare(a.salaryMonth);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const start = (page - 1) * limit;
      const paginated = all.slice(start, start + Number(limit));
      return { payslips: paginated, total: all.length, page, limit, pages: Math.ceil(all.length / limit) };
    }
  }

  /**
   * EMPLOYEE: Get own payslips only
   */
  async getMyPayslips({ employeeId, salaryMonth, page = 1, limit = 12 } = {}) {
    if (!employeeId) throw ApiError.badRequest('employeeId is required');

    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      const filter = { employeeId };
      if (salaryMonth) filter.salaryMonth = salaryMonth;
      const skip = (page - 1) * limit;
      const [payslips, total] = await Promise.all([
        Payslip.find(filter).sort({ salaryMonth: -1 }).skip(skip).limit(limit),
        Payslip.countDocuments(filter)
      ]);
      return { payslips, total, page, limit, pages: Math.ceil(total / limit) };
    } else {
      let all = devPayslipStore.findByEmployee(employeeId);
      if (salaryMonth) all = all.filter((p) => p.salaryMonth === salaryMonth);
      all.sort((a, b) => b.salaryMonth.localeCompare(a.salaryMonth));
      const start = (page - 1) * limit;
      const paginated = all.slice(start, start + Number(limit));
      return { payslips: paginated, total: all.length, page, limit, pages: Math.ceil(all.length / limit) };
    }
  }

  /**
   * Get a single payslip by ID — enforces employee can only see their own
   */
  async getPayslipById(id, { requestingEmployeeId, isAdmin } = {}) {
    const isDbConnected = getDbStatus().isConnected;
    let payslip;

    if (isDbConnected) {
      payslip = await Payslip.findById(id);
    } else {
      payslip = devPayslipStore.findById(id);
    }

    if (!payslip) throw ApiError.notFound('Payslip not found');

    // Authorization: employees can only access their own payslips
    if (!isAdmin && requestingEmployeeId && payslip.employeeId !== requestingEmployeeId) {
      throw ApiError.forbidden('You are not authorized to view this payslip');
    }

    return payslip;
  }

  /**
   * ADMIN: Update payment status of a payslip
   */
  async updatePaymentStatus(id, { paymentStatus, paymentDate, notes, updatedByName } = {}) {
    const VALID_STATUSES = ['Draft', 'Processing', 'Paid', 'Failed', 'Cancelled'];
    if (!VALID_STATUSES.includes(paymentStatus)) {
      throw ApiError.badRequest(`Invalid payment status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const isDbConnected = getDbStatus().isConnected;
    let payslip;

    if (isDbConnected) {
      payslip = await Payslip.findById(id);
    } else {
      payslip = devPayslipStore.findById(id);
    }

    if (!payslip) throw ApiError.notFound('Payslip not found');

    const updateData = {
      paymentStatus,
      paymentDate: paymentStatus === 'Paid' ? (paymentDate || new Date()) : (payslip.paymentDate || null),
      notes: notes !== undefined ? notes : payslip.notes
    };

    if (isDbConnected) {
      payslip = await Payslip.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    } else {
      payslip = devPayslipStore.update(id, updateData);
    }

    // Notify employee when payslip is marked Paid
    if (paymentStatus === 'Paid') {
      try {
        await notificationService.createNotification({
          recipientRole: 'employee',
          title: 'Payslip Disbursed',
          message: `Your salary for ${payslip.salaryMonth} has been processed and disbursed. Net amount: $${payslip.netSalary.toLocaleString()}.`,
          type: 'payroll',
          link: '/payroll'
        });
      } catch (_) {
        // notification failure is non-blocking
      }
    }

    return payslip;
  }

  /**
   * ADMIN: Delete a payslip (only Draft status allowed)
   */
  async deletePayslip(id) {
    const isDbConnected = getDbStatus().isConnected;
    let payslip;

    if (isDbConnected) {
      payslip = await Payslip.findById(id);
    } else {
      payslip = devPayslipStore.findById(id);
    }

    if (!payslip) throw ApiError.notFound('Payslip not found');

    if (payslip.paymentStatus === 'Paid') {
      throw ApiError.badRequest('Cannot delete a payslip that has already been paid');
    }

    if (isDbConnected) {
      await Payslip.findByIdAndDelete(id);
    } else {
      devPayslipStore.delete(id);
    }

    return { deleted: true };
  }

  /**
   * ADMIN: Get payroll summary metrics
   */
  async getPayrollSummary({ salaryMonth } = {}) {
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      const filter = salaryMonth ? { salaryMonth } : {};
      const [all, paid, draft, processing] = await Promise.all([
        Payslip.find(filter),
        Payslip.countDocuments({ ...filter, paymentStatus: 'Paid' }),
        Payslip.countDocuments({ ...filter, paymentStatus: 'Draft' }),
        Payslip.countDocuments({ ...filter, paymentStatus: 'Processing' })
      ]);

      const totalNetDisbursed = all
        .filter((p) => p.paymentStatus === 'Paid')
        .reduce((s, p) => s + p.netSalary, 0);

      const totalGrossLiability = all.reduce((s, p) => s + p.grossSalary, 0);

      return {
        totalPayslips: all.length,
        paidCount: paid,
        draftCount: draft,
        processingCount: processing,
        totalNetDisbursed: Math.round(totalNetDisbursed),
        totalGrossLiability: Math.round(totalGrossLiability)
      };
    } else {
      let all = devPayslipStore.getAll();
      if (salaryMonth) all = all.filter((p) => p.salaryMonth === salaryMonth);

      return {
        totalPayslips: all.length,
        paidCount: all.filter((p) => p.paymentStatus === 'Paid').length,
        draftCount: all.filter((p) => p.paymentStatus === 'Draft').length,
        processingCount: all.filter((p) => p.paymentStatus === 'Processing').length,
        totalNetDisbursed: Math.round(all.filter((p) => p.paymentStatus === 'Paid').reduce((s, p) => s + (p.netSalary || 0), 0)),
        totalGrossLiability: Math.round(all.reduce((s, p) => s + (p.grossSalary || 0), 0))
      };
    }
  }

  /**
   * Utility: Preview payslip calculation without creating a record
   * Used by the admin generate form for live preview
   */
  previewCalculation({ basicSalary, bonus = 0, allowancesOverride = {}, deductionsOverride = {}, taxOverride }) {
    if (!basicSalary || basicSalary < 0) {
      throw ApiError.badRequest('A valid basicSalary is required for preview');
    }
    return computePayslipTotals({ basicSalary, bonus, allowancesOverride, deductionsOverride, taxOverride });
  }
}

module.exports = new PayslipService();
