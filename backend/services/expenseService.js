const { getDbStatus } = require('../config/db');
const Expense = require('../models/Expense');
const ApiError = require('../utils/apiError');

const INITIAL_EXPENSES = [
  {
    _id: '66e1e0000000000000000001',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    title: 'High-Speed Home Fiber Internet (Q1)',
    category: 'Internet & Phone',
    amount: 180,
    currency: 'USD',
    expenseDate: new Date('2026-02-15'),
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    receiptName: 'Comcast_Receipt_Feb2026.pdf',
    status: 'Approved',
    notes: 'Remote work connectivity stipend claim.',
    reviewedBy: 'Anchal Keshri',
    reviewedAt: new Date('2026-02-18'),
    adminRemarks: 'Approved as per remote-work policy allowance.',
    createdAt: new Date('2026-02-15')
  },
  {
    _id: '66e1e0000000000000000002',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    title: 'Ergonomic Mechanical Keyboard & Wrist Rest',
    category: 'Office Supplies & Hardware',
    amount: 145,
    currency: 'USD',
    expenseDate: new Date('2026-02-28'),
    receiptUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    receiptName: 'Keychron_Invoice_2026.pdf',
    status: 'Approved',
    notes: 'Workstation ergonomic upgrade for engineering productivity.',
    reviewedBy: 'Anchal Keshri',
    reviewedAt: new Date('2026-03-01'),
    adminRemarks: 'Approved within $200 hardware limit.',
    createdAt: new Date('2026-02-28')
  },
  {
    _id: '66e1e0000000000000000003',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    title: 'Tech Lead Leadership Summit & Uber Commute',
    category: 'Travel & Commute',
    amount: 94.5,
    currency: 'USD',
    expenseDate: new Date('2026-03-04'),
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    receiptName: 'Uber_Receipt_Summit.pdf',
    status: 'Pending',
    notes: 'Airport and venue transfers for company architecture sync.',
    reviewedBy: null,
    reviewedAt: null,
    adminRemarks: '',
    createdAt: new Date('2026-03-04')
  },
  {
    _id: '66e1e0000000000000000004',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Vance',
    department: 'Human Resources',
    title: 'Annual HR Tech World Conference Registration',
    category: 'Learning & Books',
    amount: 350,
    currency: 'USD',
    expenseDate: new Date('2026-03-02'),
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    receiptName: 'HR_Tech_Conf_Ticket.pdf',
    status: 'Approved',
    notes: 'HR analytics best practices workshop.',
    reviewedBy: 'Anchal Keshri',
    reviewedAt: new Date('2026-03-03'),
    adminRemarks: 'Approved for annual professional development budget.',
    createdAt: new Date('2026-03-02')
  }
];

class ExpenseMemoryStore {
  constructor() {
    this.expenses = new Map();
    INITIAL_EXPENSES.forEach((exp) => this.expenses.set(exp._id, { ...exp }));
  }

  findAll({ role, employeeId, status, category }) {
    let list = Array.from(this.expenses.values());

    if (role !== 'admin') {
      list = list.filter((exp) => exp.employeeId === employeeId);
    }

    if (status && status !== 'All') {
      list = list.filter((exp) => exp.status === status);
    }

    if (category && category !== 'All') {
      list = list.filter((exp) => exp.category === category);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  findById(id) {
    return this.expenses.get(id) || null;
  }

  create(expenseData) {
    const newExp = {
      _id: '66e1e0000000000' + (this.expenses.size + 1).toString().padStart(9, '0'),
      ...expenseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.expenses.set(newExp._id, newExp);
    return newExp;
  }

  update(id, updateData) {
    const existing = this.expenses.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date()
    };
    this.expenses.set(id, updated);
    return updated;
  }

  getMetrics() {
    const all = Array.from(this.expenses.values());
    const totalClaimed = all.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalApproved = all
      .filter((e) => e.status === 'Approved' || e.status === 'Reimbursed')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pendingCount = all.filter((e) => e.status === 'Pending').length;

    return {
      totalClaims: all.length,
      totalClaimedAmount: Math.round(totalClaimed),
      totalApprovedAmount: Math.round(totalApproved),
      pendingReviewCount: pendingCount
    };
  }
}

const devStore = new ExpenseMemoryStore();

class ExpenseService {
  async getExpenses({ user, status, category }) {
    const isDbConnected = getDbStatus().isConnected;

    if (!isDbConnected) {
      const expenses = devStore.findAll({
        role: user.role,
        employeeId: user.employeeId,
        status,
        category
      });
      const metrics = devStore.getMetrics();
      return { expenses, metrics };
    }

    const filter = {};
    if (user.role !== 'admin') {
      filter.employeeId = user.employeeId;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });

    const all = await Expense.find();
    const totalClaimed = all.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalApproved = all
      .filter((e) => e.status === 'Approved' || e.status === 'Reimbursed')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pendingCount = all.filter((e) => e.status === 'Pending').length;

    return {
      expenses,
      metrics: {
        totalClaims: all.length,
        totalClaimedAmount: Math.round(totalClaimed),
        totalApprovedAmount: Math.round(totalApproved),
        pendingReviewCount: pendingCount
      }
    };
  }

  async submitExpense(data, user) {
    const isDbConnected = getDbStatus().isConnected;

    const payload = {
      employeeId: user.employeeId,
      employeeName: user.name,
      department: user.department || 'General',
      title: data.title,
      category: data.category || 'Other',
      amount: Number(data.amount),
      currency: data.currency || 'USD',
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      receiptUrl: data.receiptUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      receiptName: data.receiptName || 'receipt_attached.pdf',
      status: 'Pending',
      notes: data.notes || '',
      reviewedBy: null,
      reviewedAt: null,
      adminRemarks: ''
    };

    if (!isDbConnected) {
      return devStore.create(payload);
    }

    const expense = new Expense(payload);
    return await expense.save();
  }

  async reviewExpense(id, { status, adminRemarks }, reviewer) {
    if (!['Approved', 'Rejected', 'Reimbursed'].includes(status)) {
      throw ApiError.badRequest('Invalid status value for expense review');
    }

    const isDbConnected = getDbStatus().isConnected;

    const updatePayload = {
      status,
      adminRemarks: adminRemarks || '',
      reviewedBy: reviewer.name,
      reviewedAt: new Date()
    };

    if (!isDbConnected) {
      const updated = devStore.update(id, updatePayload);
      if (!updated) throw ApiError.notFound('Expense claim not found');
      return updated;
    }

    const updated = await Expense.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!updated) throw ApiError.notFound('Expense claim not found');
    return updated;
  }
}

module.exports = new ExpenseService();
