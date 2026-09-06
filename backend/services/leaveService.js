const { Leave, Employee, User } = require('../models');
const { getDbStatus } = require('../config/db');
const ApiError = require('../utils/apiError');
const notificationService = require('./notificationService');
const eventDispatcher = require('../jobs/eventDispatcher');

const LEAVE_QUOTAS = {
  Earned: 18,
  Sick: 12,
  Casual: 10,
  Emergency: 5,
  Other: 5
};

const INITIAL_SEED_LEAVES = [
  {
    _id: '66e4a0000000000000000001',
    employeeId: 'EMP-002',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    leaveType: 'Earned',
    startDate: new Date('2025-05-20T00:00:00.000Z'),
    endDate: new Date('2025-05-22T00:00:00.000Z'),
    totalDays: 3,
    reason: 'Family vacation and personal downtime',
    status: 'Pending',
    appliedAt: new Date('2025-05-14T09:15:00.000Z'),
    reviewedAt: null,
    reviewedBy: null,
    reviewerName: '',
    adminComment: ''
  },
  {
    _id: '66e4a0000000000000000002',
    employeeId: 'EMP-004',
    employeeName: 'Aisha Patel',
    department: 'Finance',
    leaveType: 'Casual',
    startDate: new Date('2025-05-15T00:00:00.000Z'),
    endDate: new Date('2025-05-15T00:00:00.000Z'),
    totalDays: 1,
    reason: 'Attending financial compliance conference',
    status: 'Approved',
    appliedAt: new Date('2025-05-10T11:00:00.000Z'),
    reviewedAt: new Date('2025-05-11T14:30:00.000Z'),
    reviewedBy: '66e0a0000000000000000001',
    reviewerName: 'Anchal Keshri',
    adminComment: 'Approved. Enjoy the conference sessions.'
  },
  {
    _id: '66e4a0000000000000000003',
    employeeId: 'EMP-003',
    employeeName: 'Marcus Vance',
    department: 'Product',
    leaveType: 'Sick',
    startDate: new Date('2025-05-02T00:00:00.000Z'),
    endDate: new Date('2025-05-03T00:00:00.000Z'),
    totalDays: 2,
    reason: 'Viral fever recovery',
    status: 'Approved',
    appliedAt: new Date('2025-05-01T08:00:00.000Z'),
    reviewedAt: new Date('2025-05-01T10:00:00.000Z'),
    reviewedBy: '66e0a0000000000000000001',
    reviewerName: 'Anchal Keshri',
    adminComment: 'Get well soon.'
  },
  {
    _id: '66e4a0000000000000000004',
    employeeId: 'EMP-006',
    employeeName: 'Liam Gallagher',
    department: 'Human Resources',
    leaveType: 'Emergency',
    startDate: new Date('2025-05-08T00:00:00.000Z'),
    endDate: new Date('2025-05-09T00:00:00.000Z'),
    totalDays: 2,
    reason: 'Urgent home maintenance and pipe repair',
    status: 'Rejected',
    appliedAt: new Date('2025-05-07T16:00:00.000Z'),
    reviewedAt: new Date('2025-05-08T09:00:00.000Z'),
    reviewedBy: '66e0a0000000000000000001',
    reviewerName: 'Anchal Keshri',
    adminComment: 'Critical payroll run scheduled on these dates; please re-apply for next week.'
  }
];

class DevMemoryLeaveStore {
  constructor() {
    this.leaves = new Map();
    INITIAL_SEED_LEAVES.forEach((l) => {
      this.leaves.set(l._id, { ...l });
    });
  }

  getAll() {
    return Array.from(this.leaves.values());
  }

  findById(id) {
    return this.leaves.get(id) || null;
  }

  create(record) {
    const _id = `66e4a00000000000000000${(this.leaves.size + 10).toString().padStart(2, '0')}`;
    const newRecord = {
      _id,
      ...record,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.leaves.set(_id, newRecord);
    return newRecord;
  }

  update(id, data) {
    const existing = this.leaves.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.leaves.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.leaves.delete(id);
  }
}

const devLeaveStore = new DevMemoryLeaveStore();

class LeaveService {
  /**
   * Resolve employee record for authenticated user
   */
  async resolveEmployee(user) {
    const isDbConnected = getDbStatus().isConnected;
    let employee = null;

    if (isDbConnected) {
      employee = await Employee.findOne({
        $or: [{ user: user._id || user.id }, { email: user.email?.toLowerCase().trim() }]
      });
    }

    if (!employee) {
      const empId = user.employeeId || `EMP-${(user._id || user.id || '002').toString().slice(-3)}`;
      return {
        _id: user._id || user.id,
        employeeId: empId,
        name: user.name || `${user.firstName || 'Employee'} ${user.lastName || 'User'}`,
        department: user.department || 'Engineering'
      };
    }

    return {
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name || `${employee.firstName} ${employee.lastName}`,
      department: employee.department
    };
  }

  /**
   * Employee: Apply for leave
   */
  async applyLeave(user, data) {
    const { leaveType, startDate, endDate, reason } = data;

    if (!leaveType || !startDate || !endDate || !reason) {
      throw ApiError.badRequest('Please provide leaveType, startDate, endDate, and reason');
    }

    const validTypes = ['Casual', 'Sick', 'Earned', 'Emergency', 'Other'];
    if (!validTypes.includes(leaveType)) {
      throw ApiError.badRequest(`Invalid leave type '${leaveType}'. Allowed: ${validTypes.join(', ')}`);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw ApiError.badRequest('Invalid date format provided');
    }

    if (start > end) {
      throw ApiError.badRequest('Start date cannot be after end date');
    }

    const employee = await this.resolveEmployee(user);
    const isDbConnected = getDbStatus().isConnected;

    // Check duplicate or overlapping pending/approved leaves
    if (isDbConnected) {
      const conflict = await Leave.findOne({
        employee: employee._id,
        status: { $in: ['Pending', 'Approved'] },
        startDate: { $lte: end },
        endDate: { $gte: start }
      });

      if (conflict) {
        throw ApiError.badRequest(
          `Conflicting leave request: You already have a ${conflict.status.toLowerCase()} ${conflict.leaveType} leave between ${conflict.startDate.toISOString().slice(0, 10)} and ${conflict.endDate.toISOString().slice(0, 10)}.`
        );
      }
    } else {
      const conflict = devLeaveStore.getAll().find(
        (l) =>
          l.employeeId === employee.employeeId &&
          ['Pending', 'Approved'].includes(l.status) &&
          new Date(l.startDate) <= end &&
          new Date(l.endDate) >= start
      );

      if (conflict) {
        throw ApiError.badRequest(
          `Conflicting leave request: You already have a ${conflict.status.toLowerCase()} ${conflict.leaveType} leave between ${new Date(conflict.startDate).toISOString().slice(0, 10)} and ${new Date(conflict.endDate).toISOString().slice(0, 10)}.`
        );
      }
    }

    const diffMs = end - start;
    const totalDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

    const leaveData = {
      employee: employee._id,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      department: employee.department,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason.trim(),
      status: 'Pending',
      appliedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewerName: '',
      adminComment: ''
    };

    let createdLeave;
    if (isDbConnected) {
      createdLeave = await Leave.create(leaveData);
    } else {
      createdLeave = devLeaveStore.create(leaveData);
    }

    // Dispatch notification to admins
    await notificationService.createNotification({
      recipientRole: 'admin',
      title: 'New Leave Application',
      message: `${employee.name} (${employee.department}) applied for ${totalDays} day(s) of ${leaveType} leave.`,
      type: 'leave',
      link: '/leaves'
    });

    // Dispatch confirmation notification to the submitting employee
    await notificationService.createNotification({
      recipient: employee._id,
      recipientRole: 'employee',
      title: 'Leave Application Submitted',
      message: `Your ${leaveType} leave request for ${totalDays} day(s) (${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}) has been submitted and is pending HR review.`,
      type: 'leave',
      link: '/leaves'
    });

    // Event-driven asynchronous email alert to HR
    eventDispatcher.leaveSubmitted(createdLeave, employee);

    return createdLeave;
  }

  /**
   * Employee: View personal leave history
   */
  async getMyLeaves(user, query = {}) {
    const employee = await this.resolveEmployee(user);
    const isDbConnected = getDbStatus().isConnected;
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    if (isDbConnected) {
      const filter = { employee: employee._id };
      if (query.status && query.status !== 'All') {
        filter.status = query.status;
      }
      if (query.leaveType && query.leaveType !== 'All') {
        filter.leaveType = query.leaveType;
      }

      const [leaves, total] = await Promise.all([
        Leave.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(limit),
        Leave.countDocuments(filter)
      ]);

      return {
        leaves,
        pagination: { total, totalPages: Math.ceil(total / limit) || 1, page, limit }
      };
    } else {
      let list = devLeaveStore.getAll().filter((l) => l.employeeId === employee.employeeId);

      if (query.status && query.status !== 'All') {
        list = list.filter((l) => l.status.toLowerCase() === query.status.toLowerCase());
      }
      if (query.leaveType && query.leaveType !== 'All') {
        list = list.filter((l) => l.leaveType.toLowerCase() === query.leaveType.toLowerCase());
      }

      list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      const total = list.length;
      const paginated = list.slice(skip, skip + limit);

      return {
        leaves: paginated,
        pagination: { total, totalPages: Math.ceil(total / limit) || 1, page, limit }
      };
    }
  }

  /**
   * Employee: View personal leave quota balances
   */
  async getMyLeaveBalance(user) {
    const employee = await this.resolveEmployee(user);
    const isDbConnected = getDbStatus().isConnected;

    let leaves = [];
    if (isDbConnected) {
      leaves = await Leave.find({ employee: employee._id });
    } else {
      leaves = devLeaveStore.getAll().filter((l) => l.employeeId === employee.employeeId);
    }

    const currentYear = new Date().getFullYear();
    const approvedLeavesThisYear = leaves.filter(
      (l) => l.status === 'Approved' && new Date(l.startDate).getFullYear() === currentYear
    );

    const pendingLeaves = leaves.filter((l) => l.status === 'Pending');

    const balances = {};
    for (const [type, quota] of Object.entries(LEAVE_QUOTAS)) {
      const used = approvedLeavesThisYear
        .filter((l) => l.leaveType === type)
        .reduce((sum, l) => sum + (l.totalDays || 1), 0);

      const pending = pendingLeaves
        .filter((l) => l.leaveType === type)
        .reduce((sum, l) => sum + (l.totalDays || 1), 0);

      balances[type] = {
        total: quota,
        used,
        pending,
        remaining: Math.max(0, quota - used)
      };
    }

    return {
      balances,
      totalRemaining: Object.values(balances).reduce((acc, b) => acc + b.remaining, 0),
      totalUsed: Object.values(balances).reduce((acc, b) => acc + b.used, 0)
    };
  }

  /**
   * Employee: Cancel an eligible pending leave request
   */
  async cancelLeave(user, leaveId) {
    const employee = await this.resolveEmployee(user);
    const isDbConnected = getDbStatus().isConnected;

    let leave;
    if (isDbConnected) {
      leave = await Leave.findById(leaveId);
    } else {
      leave = devLeaveStore.findById(leaveId);
    }

    if (!leave) {
      throw ApiError.notFound(`Leave request not found with ID ${leaveId}`);
    }

    // Authorization check: must belong to the user
    const matchesEmployee =
      leave.employeeId === employee.employeeId ||
      (leave.employee && leave.employee.toString() === employee._id.toString());

    if (!matchesEmployee && user.role !== 'admin') {
      throw ApiError.forbidden('You are not authorized to cancel this leave request');
    }

    if (leave.status !== 'Pending') {
      throw ApiError.badRequest(`Cannot cancel leave with status '${leave.status}'. Only pending requests can be cancelled.`);
    }

    let updated;
    if (isDbConnected) {
      leave.status = 'Cancelled';
      updated = await leave.save();
    } else {
      updated = devLeaveStore.update(leaveId, { status: 'Cancelled' });
    }

    // Notify admins
    await notificationService.createNotification({
      recipientRole: 'admin',
      title: 'Leave Request Cancelled',
      message: `${employee.name} cancelled their ${leave.leaveType} leave request.`,
      type: 'leave',
      link: '/leaves'
    });

    return updated;
  }

  /**
   * Admin: Get all leave requests with filters
   */
  async getAdminLeaves(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { status, department, leaveType, startDate, endDate, search, sortBy = 'appliedAt', sortOrder = 'desc' } = query;
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      const filter = {};

      if (status && status !== 'All') {
        filter.status = status;
      }
      if (department && department !== 'All') {
        filter.department = department;
      }
      if (leaveType && leaveType !== 'All') {
        filter.leaveType = leaveType;
      }
      if (startDate && endDate) {
        filter.startDate = { $gte: new Date(startDate) };
        filter.endDate = { $lte: new Date(endDate) };
      }
      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { employeeName: searchRegex },
          { employeeId: searchRegex },
          { reason: searchRegex }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [leaves, total] = await Promise.all([
        Leave.find(filter).sort(sortOptions).skip(skip).limit(limit),
        Leave.countDocuments(filter)
      ]);

      return {
        leaves,
        pagination: { total, totalPages: Math.ceil(total / limit) || 1, page, limit }
      };
    } else {
      let list = devLeaveStore.getAll();

      if (status && status !== 'All') {
        list = list.filter((l) => l.status.toLowerCase() === status.toLowerCase());
      }
      if (department && department !== 'All') {
        list = list.filter((l) => l.department === department);
      }
      if (leaveType && leaveType !== 'All') {
        list = list.filter((l) => l.leaveType.toLowerCase() === leaveType.toLowerCase());
      }
      if (startDate && endDate) {
        const s = new Date(startDate).getTime();
        const e = new Date(endDate).getTime();
        list = list.filter((l) => new Date(l.startDate).getTime() >= s && new Date(l.endDate).getTime() <= e);
      }
      if (search) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (l) =>
            l.employeeName?.toLowerCase().includes(q) ||
            l.employeeId?.toLowerCase().includes(q) ||
            l.reason?.toLowerCase().includes(q)
        );
      }

      list.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });

      const total = list.length;
      const paginated = list.slice(skip, skip + limit);

      return {
        leaves: paginated,
        pagination: { total, totalPages: Math.ceil(total / limit) || 1, page, limit }
      };
    }
  }

  /**
   * Admin / Dashboard: Leave summary metrics
   */
  async getLeaveSummary(query = {}) {
    const isDbConnected = getDbStatus().isConnected;
    let leaves = [];

    if (isDbConnected) {
      const filter = {};
      if (query.department && query.department !== 'All') {
        filter.department = query.department;
      }
      leaves = await Leave.find(filter);
    } else {
      leaves = devLeaveStore.getAll();
      if (query.department && query.department !== 'All') {
        leaves = leaves.filter((l) => l.department === query.department);
      }
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
    const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
    const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;
    const cancelledCount = leaves.filter((l) => l.status === 'Cancelled').length;

    // Check currently on-leave staff today
    const onLeaveToday = leaves.filter((l) => {
      if (l.status !== 'Approved') return false;
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      s.setUTCHours(0, 0, 0, 0);
      e.setUTCHours(23, 59, 59, 999);
      return today >= s && today <= e;
    }).length;

    return {
      totalRequests: leaves.length,
      pendingCount,
      approvedCount,
      rejectedCount,
      cancelledCount,
      onLeaveToday
    };
  }

  /**
   * Single leave details
   */
  async getLeaveById(id, requestingUser = null) {
    const isDbConnected = getDbStatus().isConnected;
    let leave;
    if (isDbConnected) {
      leave = await Leave.findById(id).populate('reviewedBy', 'name email role');
    } else {
      leave = devLeaveStore.findById(id);
    }

    if (!leave) {
      throw ApiError.notFound(`Leave record not found with ID ${id}`);
    }

    // Enforce IDOR protection: Non-admin users can only view their own leave requests
    if (requestingUser && requestingUser.role !== 'admin') {
      const employee = await this.resolveEmployee(requestingUser);
      const matches =
        (employee && leave.employeeId === employee.employeeId) ||
        (employee && leave.employee && leave.employee.toString() === employee._id.toString());

      if (!matches) {
        throw ApiError.forbidden('Forbidden: You are not authorized to view another employee leave record');
      }
    }

    return leave;
  }

  /**
   * Admin: Review (Approve or Reject) leave request
   */
  async reviewLeave(adminUser, leaveId, reviewData) {
    const { status, adminComment } = reviewData;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      throw ApiError.badRequest("Review status must be either 'Approved' or 'Rejected'");
    }

    const isDbConnected = getDbStatus().isConnected;
    let leave;

    if (isDbConnected) {
      leave = await Leave.findById(leaveId);
    } else {
      leave = devLeaveStore.findById(leaveId);
    }

    if (!leave) {
      throw ApiError.notFound(`Leave request not found with ID ${leaveId}`);
    }

    if (leave.status === 'Cancelled') {
      throw ApiError.badRequest('Cannot review a leave request that has been cancelled by the employee');
    }

    const reviewerName = adminUser.name || `${adminUser.firstName || 'HR'} ${adminUser.lastName || 'Admin'}`;
    const updatePayload = {
      status,
      reviewedAt: new Date(),
      reviewedBy: adminUser._id || adminUser.id,
      reviewerName,
      adminComment: adminComment || (status === 'Approved' ? 'Leave request approved' : 'Leave request rejected')
    };

    let updated;
    if (isDbConnected) {
      Object.assign(leave, updatePayload);
      updated = await leave.save();
    } else {
      updated = devLeaveStore.update(leaveId, updatePayload);
    }

    // Dispatch notification to the employee
    await notificationService.createNotification({
      recipient: leave.employee,
      recipientRole: 'employee',
      title: `Leave Request ${status}`,
      message: `Your ${leave.leaveType} leave (${leave.totalDays} days) was ${status.toLowerCase()} by ${reviewerName}.${adminComment ? ` Note: "${adminComment}"` : ''}`,
      type: 'leave',
      link: '/leaves'
    });

    // Event-driven asynchronous email notification to employee
    if (status === 'Approved') {
      eventDispatcher.leaveApproved(updated, null, reviewerName);
    } else if (status === 'Rejected') {
      eventDispatcher.leaveRejected(updated, null, reviewerName, adminComment);
    }

    return updated;
  }
}

module.exports = new LeaveService();
