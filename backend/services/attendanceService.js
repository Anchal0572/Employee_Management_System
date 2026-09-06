const { Attendance, Employee, User } = require('../models');
const { getDbStatus } = require('../config/db');
const ApiError = require('../utils/apiError');

// Helper to normalize a date to midnight UTC (YYYY-MM-DD)
function normalizeDate(d = new Date()) {
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) {
    throw ApiError.badRequest('Invalid date string provided');
  }
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 0, 0, 0, 0));
}

// Initial seed attendance records for memory fallback
const INITIAL_SEED_ATTENDANCE = [
  {
    _id: '66e2a0000000000000000001',
    employeeId: 'EMP-001',
    employeeName: 'Anchal Keshri',
    department: 'Engineering',
    date: new Date('2025-05-15T00:00:00.000Z'),
    checkIn: new Date('2025-05-15T08:55:00.000Z'),
    checkOut: new Date('2025-05-15T17:35:00.000Z'),
    status: 'Present',
    workingHours: 8.67,
    remarks: 'Regular morning shift completed on-time',
    shift: 'Standard Shift (09:00 - 18:00)',
    location: 'Office HQ - Floor 4',
    createdAt: new Date('2025-05-15T08:55:00.000Z')
  },
  {
    _id: '66e2a0000000000000000002',
    employeeId: 'EMP-002',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    date: new Date('2025-05-15T00:00:00.000Z'),
    checkIn: new Date('2025-05-15T09:42:00.000Z'),
    checkOut: new Date('2025-05-15T18:15:00.000Z'),
    status: 'Late',
    workingHours: 8.55,
    remarks: 'Transit delay on commuter rail',
    shift: 'Standard Shift (09:00 - 18:00)',
    location: 'Office HQ - Floor 4',
    createdAt: new Date('2025-05-15T09:42:00.000Z')
  },
  {
    _id: '66e2a0000000000000000003',
    employeeId: 'EMP-003',
    employeeName: 'Marcus Vance',
    department: 'Product',
    date: new Date('2025-05-15T00:00:00.000Z'),
    checkIn: new Date('2025-05-15T08:48:00.000Z'),
    checkOut: new Date('2025-05-15T17:15:00.000Z'),
    status: 'Present',
    workingHours: 8.45,
    remarks: 'Customer roadmap review session',
    shift: 'Standard Shift (09:00 - 18:00)',
    location: 'Office HQ - Floor 3',
    createdAt: new Date('2025-05-15T08:48:00.000Z')
  },
  {
    _id: '66e2a0000000000000000004',
    employeeId: 'EMP-004',
    employeeName: 'Aisha Patel',
    department: 'Finance',
    date: new Date('2025-05-15T00:00:00.000Z'),
    checkIn: null,
    checkOut: null,
    status: 'Leave',
    workingHours: 0,
    remarks: 'Approved Annual Leave',
    shift: 'Standard Shift (09:00 - 18:00)',
    location: 'Remote',
    createdAt: new Date('2025-05-15T00:00:00.000Z')
  },
  {
    _id: '66e2a0000000000000000005',
    employeeId: 'EMP-005',
    employeeName: 'Amara Okafor',
    department: 'Engineering',
    date: new Date('2025-05-15T00:00:00.000Z'),
    checkIn: new Date('2025-05-15T09:02:00.000Z'),
    checkOut: new Date('2025-05-15T12:50:00.000Z'),
    status: 'Half Day',
    workingHours: 3.80,
    remarks: 'Medical appointment in afternoon',
    shift: 'Standard Shift (09:00 - 18:00)',
    location: 'Office HQ - Floor 4',
    createdAt: new Date('2025-05-15T09:02:00.000Z')
  },
  {
    _id: '66e2a0000000000000000006',
    employeeId: 'EMP-006',
    employeeName: 'Liam Gallagher',
    department: 'Human Resources',
    date: new Date('2025-05-15T00:00:00.000Z'),
    checkIn: null,
    checkOut: null,
    status: 'Absent',
    workingHours: 0,
    remarks: 'Unscheduled absence',
    shift: 'Standard Shift (09:00 - 18:00)',
    location: 'N/A',
    createdAt: new Date('2025-05-15T00:00:00.000Z')
  }
];

class DevMemoryAttendanceStore {
  constructor() {
    this.records = new Map();
    INITIAL_SEED_ATTENDANCE.forEach((rec) => {
      const key = `${rec.employeeId}_${normalizeDate(rec.date).toISOString()}`;
      this.records.set(key, { ...rec });
    });
  }

  getAll() {
    return Array.from(this.records.values());
  }

  findById(id) {
    for (const rec of this.records.values()) {
      if (rec._id === id) return rec;
    }
    return null;
  }

  findByEmployeeAndDate(employeeId, date) {
    const key = `${employeeId}_${normalizeDate(date).toISOString()}`;
    return this.records.get(key) || null;
  }

  create(record) {
    const _id = `66e2a00000000000000000${(this.records.size + 10).toString().padStart(2, '0')}`;
    const key = `${record.employeeId}_${normalizeDate(record.date).toISOString()}`;
    const newRecord = {
      _id,
      ...record,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.records.set(key, newRecord);
    return newRecord;
  }

  update(id, updateData) {
    for (const [key, rec] of this.records.entries()) {
      if (rec._id === id) {
        const updated = { ...rec, ...updateData, updatedAt: new Date() };
        this.records.set(key, updated);
        return updated;
      }
    }
    return null;
  }

  delete(id) {
    for (const [key, rec] of this.records.entries()) {
      if (rec._id === id) {
        this.records.delete(key);
        return true;
      }
    }
    return false;
  }
}

const devAttendanceStore = new DevMemoryAttendanceStore();

class AttendanceService {
  /**
   * Helper to resolve an employee profile for a given user
   */
  async resolveEmployee(user) {
    const isDbConnected = getDbStatus().isConnected;
    let employee = null;

    if (isDbConnected) {
      // Find employee by user ref or matching corporate email
      employee = await Employee.findOne({
        $or: [{ user: user._id || user.id }, { email: user.email.toLowerCase().trim() }]
      });
    }

    if (!employee) {
      // Synthesize profile based on user
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
   * Check In for the authenticated employee
   */
  async checkIn(user, options = {}) {
    const employee = await this.resolveEmployee(user);
    const now = options.checkIn ? new Date(options.checkIn) : new Date();

    // Prevent impossible timestamps (future)
    const fiveMinutesFuture = new Date(Date.now() + 5 * 60 * 1000);
    if (now > fiveMinutesFuture) {
      throw ApiError.badRequest('Check-in timestamp cannot be in the future');
    }

    const today = normalizeDate(options.date || now);
    const isDbConnected = getDbStatus().isConnected;

    // Determine punctuality (Standard shift: 09:00 AM, grace up to 09:30 AM local/UTC)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);
    const status = options.status || (isLate ? 'Late' : 'Present');

    if (isDbConnected) {
      // Check existing check-in today
      const existing = await Attendance.findOne({
        employee: employee._id,
        date: today
      });

      if (existing && existing.checkIn) {
        throw ApiError.badRequest('Duplicate check-in rejected. Employee has already checked in for today.');
      }

      if (existing) {
        // Update existing pre-created placeholder
        existing.checkIn = now;
        existing.status = status;
        existing.remarks = options.remarks || (isLate ? 'Late check-in recorded' : 'On-time check-in recorded');
        await existing.save();
        return existing;
      }

      const created = await Attendance.create({
        employee: employee._id,
        employeeId: employee.employeeId,
        employeeName: employee.name,
        department: employee.department,
        date: today,
        checkIn: now,
        status,
        remarks: options.remarks || (isLate ? 'Late check-in recorded' : 'On-time check-in recorded'),
        location: options.location || 'Office HQ - Main Tower'
      });
      return created;
    } else {
      // Dev Memory Store Fallback
      const existing = devAttendanceStore.findByEmployeeAndDate(employee.employeeId, today);
      if (existing && existing.checkIn) {
        throw ApiError.badRequest('Duplicate check-in rejected. Employee has already checked in for today.');
      }

      const recordData = {
        employee: employee._id,
        employeeId: employee.employeeId,
        employeeName: employee.name,
        department: employee.department,
        date: today,
        checkIn: now,
        checkOut: null,
        status,
        workingHours: 0,
        remarks: options.remarks || (isLate ? 'Late check-in recorded' : 'On-time check-in recorded'),
        shift: 'Standard Shift (09:00 - 18:00)',
        location: options.location || 'Office HQ - Main Tower'
      };

      return devAttendanceStore.create(recordData);
    }
  }

  /**
   * Check Out for the authenticated employee
   */
  async checkOut(user, options = {}) {
    const employee = await this.resolveEmployee(user);
    const now = options.checkOut ? new Date(options.checkOut) : new Date();

    const fiveMinutesFuture = new Date(Date.now() + 5 * 60 * 1000);
    if (now > fiveMinutesFuture) {
      throw ApiError.badRequest('Check-out timestamp cannot be in the future');
    }

    const today = normalizeDate(options.date || now);
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      const attendance = await Attendance.findOne({
        employee: employee._id,
        date: today
      });

      if (!attendance || !attendance.checkIn) {
        throw ApiError.badRequest('Invalid check-out: No active check-in record found for today.');
      }

      if (attendance.checkOut) {
        throw ApiError.badRequest('Invalid check-out: Employee has already completed check-out for today.');
      }

      if (now < new Date(attendance.checkIn)) {
        throw ApiError.badRequest('Check-out timestamp cannot be earlier than check-in timestamp');
      }

      attendance.checkOut = now;
      const diffMs = now - new Date(attendance.checkIn);
      const hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      attendance.workingHours = hoursWorked;

      // Adjust Half Day if worked less than 4 hours
      if (hoursWorked < 4 && (attendance.status === 'Present' || attendance.status === 'Late')) {
        attendance.status = 'Half Day';
      }

      if (options.remarks) {
        attendance.remarks = options.remarks;
      }

      await attendance.save();
      return attendance;
    } else {
      // Dev Memory Store
      const attendance = devAttendanceStore.findByEmployeeAndDate(employee.employeeId, today);

      if (!attendance || !attendance.checkIn) {
        throw ApiError.badRequest('Invalid check-out: No active check-in record found for today.');
      }

      if (attendance.checkOut) {
        throw ApiError.badRequest('Invalid check-out: Employee has already completed check-out for today.');
      }

      if (now < new Date(attendance.checkIn)) {
        throw ApiError.badRequest('Check-out timestamp cannot be earlier than check-in timestamp');
      }

      const diffMs = now - new Date(attendance.checkIn);
      const hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      let newStatus = attendance.status;

      if (hoursWorked < 4 && (newStatus === 'Present' || newStatus === 'Late')) {
        newStatus = 'Half Day';
      }

      const updated = devAttendanceStore.update(attendance._id, {
        checkOut: now,
        workingHours: hoursWorked,
        status: newStatus,
        remarks: options.remarks || attendance.remarks
      });

      return updated;
    }
  }

  /**
   * Get today's attendance state for authenticated user
   */
  async getTodayStatus(user) {
    const employee = await this.resolveEmployee(user);
    const today = normalizeDate(new Date());
    const isDbConnected = getDbStatus().isConnected;

    let record = null;
    if (isDbConnected) {
      record = await Attendance.findOne({
        employee: employee._id,
        date: today
      });
    } else {
      record = devAttendanceStore.findByEmployeeAndDate(employee.employeeId, today);
    }

    const isClockedIn = Boolean(record && record.checkIn && !record.checkOut);
    return {
      record,
      isClockedIn,
      clockInTime: record?.checkIn || null,
      clockOutTime: record?.checkOut || null,
      status: record?.status || 'Not Checked In',
      workingHours: record?.workingHours || 0
    };
  }

  /**
   * Get punch history for authenticated employee
   */
  async getMyHistory(user, query = {}) {
    const employee = await this.resolveEmployee(user);
    const isDbConnected = getDbStatus().isConnected;
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    if (isDbConnected) {
      const filter = { employee: employee._id };
      if (query.status && query.status !== 'All') {
        filter.status = new RegExp(`^${query.status}$`, 'i');
      }
      if (query.startDate && query.endDate) {
        filter.date = {
          $gte: normalizeDate(query.startDate),
          $lte: normalizeDate(query.endDate)
        };
      }

      const [records, total] = await Promise.all([
        Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
        Attendance.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      return {
        records,
        pagination: { total, totalPages, page, limit }
      };
    } else {
      let list = devAttendanceStore.getAll().filter((r) => r.employeeId === employee.employeeId);

      if (query.status && query.status !== 'All') {
        list = list.filter((r) => r.status.toLowerCase() === query.status.toLowerCase());
      }
      if (query.startDate && query.endDate) {
        const start = normalizeDate(query.startDate).getTime();
        const end = normalizeDate(query.endDate).getTime();
        list = list.filter((r) => {
          const t = new Date(r.date).getTime();
          return t >= start && t <= end;
        });
      }

      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      const total = list.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginated = list.slice(skip, skip + limit);

      return {
        records: paginated,
        pagination: { total, totalPages, page, limit }
      };
    }
  }

  /**
   * Get employee attendance summary metrics
   */
  async getMySummary(user) {
    const employee = await this.resolveEmployee(user);
    const isDbConnected = getDbStatus().isConnected;

    let records = [];
    if (isDbConnected) {
      records = await Attendance.find({ employee: employee._id });
    } else {
      records = devAttendanceStore.getAll().filter((r) => r.employeeId === employee.employeeId);
    }

    const presentCount = records.filter((r) => r.status === 'Present').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const halfDayCount = records.filter((r) => r.status === 'Half Day').length;
    const leaveCount = records.filter((r) => r.status === 'Leave').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;

    const totalWorked = records.filter((r) => r.workingHours > 0);
    const avgWorkingHours = totalWorked.length > 0
      ? parseFloat((totalWorked.reduce((acc, r) => acc + r.workingHours, 0) / totalWorked.length).toFixed(1))
      : 0;

    const totalDays = records.length || 1;
    const attendancePercentage = Math.round(((presentCount + lateCount + halfDayCount * 0.5) / totalDays) * 100);

    return {
      attendancePercentage,
      presentCount,
      lateCount,
      halfDayCount,
      leaveCount,
      absentCount,
      avgWorkingHours,
      totalLoggedDays: records.length
    };
  }

  /**
   * Admin: Get all attendance records with comprehensive filtering
   */
  async getAdminAttendance(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { employeeId, department, date, startDate, endDate, status, search, sortBy = 'date', sortOrder = 'desc' } = query;
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      const filter = {};

      if (employeeId) {
        filter.employeeId = employeeId;
      }
      if (department && department !== 'All') {
        filter.department = department;
      }
      if (status && status !== 'All') {
        filter.status = new RegExp(`^${status}$`, 'i');
      }
      if (date) {
        filter.date = normalizeDate(date);
      } else if (startDate && endDate) {
        filter.date = {
          $gte: normalizeDate(startDate),
          $lte: normalizeDate(endDate)
        };
      }
      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { employeeName: searchRegex },
          { employeeId: searchRegex },
          { remarks: searchRegex }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [records, total] = await Promise.all([
        Attendance.find(filter).sort(sortOptions).skip(skip).limit(limit),
        Attendance.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      return {
        records,
        pagination: { total, totalPages, page, limit }
      };
    } else {
      // Dev Memory Store
      let list = devAttendanceStore.getAll();

      if (employeeId) {
        list = list.filter((r) => r.employeeId === employeeId);
      }
      if (department && department !== 'All') {
        list = list.filter((r) => r.department === department);
      }
      if (status && status !== 'All') {
        list = list.filter((r) => r.status.toLowerCase() === status.toLowerCase());
      }
      if (date) {
        const target = normalizeDate(date).getTime();
        list = list.filter((r) => new Date(r.date).getTime() === target);
      } else if (startDate && endDate) {
        const s = normalizeDate(startDate).getTime();
        const e = normalizeDate(endDate).getTime();
        list = list.filter((r) => {
          const t = new Date(r.date).getTime();
          return t >= s && t <= e;
        });
      }
      if (search) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (r) =>
            r.employeeName?.toLowerCase().includes(q) ||
            r.employeeId?.toLowerCase().includes(q) ||
            r.remarks?.toLowerCase().includes(q)
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
      const totalPages = Math.ceil(total / limit) || 1;
      const paginated = list.slice(skip, skip + limit);

      return {
        records: paginated,
        pagination: { total, totalPages, page, limit }
      };
    }
  }

  /**
   * Admin / Dashboard: Calculate enterprise workforce attendance metrics
   */
  async getAttendanceMetrics(query = {}) {
    const isDbConnected = getDbStatus().isConnected;
    let records = [];
    let totalWorkforce = 6;

    if (isDbConnected) {
      const filter = {};
      if (query.date) {
        filter.date = normalizeDate(query.date);
      }
      if (query.department && query.department !== 'All') {
        filter.department = query.department;
      }
      records = await Attendance.find(filter);
      totalWorkforce = await Employee.countDocuments({ status: { $ne: 'terminated' } });
    } else {
      records = devAttendanceStore.getAll();
      if (query.date) {
        const target = normalizeDate(query.date).getTime();
        records = records.filter((r) => new Date(r.date).getTime() === target);
      }
      if (query.department && query.department !== 'All') {
        records = records.filter((r) => r.department === query.department);
      }
    }

    const presentCount = records.filter((r) => r.status === 'Present').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const halfDayCount = records.filter((r) => r.status === 'Half Day').length;
    const leaveCount = records.filter((r) => r.status === 'Leave').length;
    const recordedAbsent = records.filter((r) => r.status === 'Absent').length;

    // Active unattended workforce counted as Absent
    const unaccounted = Math.max(0, totalWorkforce - (presentCount + lateCount + halfDayCount + leaveCount + recordedAbsent));
    const absentCount = recordedAbsent + unaccounted;

    const basePopulation = Math.max(totalWorkforce, records.length, 1);
    const attendancePercentage = Math.min(100, Math.round(((presentCount + lateCount + halfDayCount * 0.5) / basePopulation) * 100));

    const shiftsWithHours = records.filter((r) => r.workingHours > 0);
    const averageWorkingHours = shiftsWithHours.length > 0
      ? parseFloat((shiftsWithHours.reduce((acc, r) => acc + r.workingHours, 0) / shiftsWithHours.length).toFixed(1))
      : 8.2;

    return {
      attendancePercentage,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      leaveCount,
      averageWorkingHours,
      totalWorkforce,
      totalRecords: records.length
    };
  }

  /**
   * Admin: Create manual attendance entry
   */
  async createManualAttendance(data) {
    const { employeeId, date, checkIn, checkOut, status = 'Present', remarks, department } = data;

    if (!employeeId || !date) {
      throw ApiError.badRequest('Employee ID and date are required for attendance entry');
    }

    const targetDate = normalizeDate(date);
    const isDbConnected = getDbStatus().isConnected;

    let employeeName = data.employeeName || 'Staff Member';
    let empDept = department || 'Engineering';
    let employeeObjectId = null;

    if (isDbConnected) {
      const emp = await Employee.findOne({ employeeId });
      if (emp) {
        employeeName = emp.name || `${emp.firstName} ${emp.lastName}`;
        empDept = emp.department;
        employeeObjectId = emp._id;
      } else {
        throw ApiError.notFound(`Employee with ID ${employeeId} not found`);
      }

      // Check duplicate
      const existing = await Attendance.findOne({ employee: employeeObjectId, date: targetDate });
      if (existing) {
        throw ApiError.badRequest(`Attendance record already exists for employee ${employeeId} on date ${targetDate.toISOString().slice(0, 10)}`);
      }

      let workingHours = 0;
      if (checkIn && checkOut) {
        const diff = new Date(checkOut) - new Date(checkIn);
        if (diff < 0) {
          throw ApiError.badRequest('Check-out timestamp cannot be earlier than check-in timestamp');
        }
        workingHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
      }

      const created = await Attendance.create({
        employee: employeeObjectId,
        employeeId,
        employeeName,
        department: empDept,
        date: targetDate,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status,
        workingHours,
        remarks: remarks || 'Manual entry by Administrator'
      });
      return created;
    } else {
      const existing = devAttendanceStore.findByEmployeeAndDate(employeeId, targetDate);
      if (existing) {
        throw ApiError.badRequest(`Attendance record already exists for employee ${employeeId} on date ${targetDate.toISOString().slice(0, 10)}`);
      }

      let workingHours = 0;
      if (checkIn && checkOut) {
        const diff = new Date(checkOut) - new Date(checkIn);
        if (diff < 0) {
          throw ApiError.badRequest('Check-out timestamp cannot be earlier than check-in timestamp');
        }
        workingHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
      }

      return devAttendanceStore.create({
        employeeId,
        employeeName,
        department: empDept,
        date: targetDate,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status,
        workingHours,
        remarks: remarks || 'Manual entry by Administrator'
      });
    }
  }

  /**
   * Admin: Update existing attendance record
   */
  async updateAttendance(id, updateData) {
    const isDbConnected = getDbStatus().isConnected;

    if (updateData.checkIn && updateData.checkOut) {
      if (new Date(updateData.checkOut) < new Date(updateData.checkIn)) {
        throw ApiError.badRequest('Check-out timestamp cannot be earlier than check-in timestamp');
      }
      const diff = new Date(updateData.checkOut) - new Date(updateData.checkIn);
      updateData.workingHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
    }

    if (isDbConnected) {
      const updated = await Attendance.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      if (!updated) {
        throw ApiError.notFound(`Attendance record with ID ${id} not found`);
      }
      return updated;
    } else {
      const updated = devAttendanceStore.update(id, updateData);
      if (!updated) {
        throw ApiError.notFound(`Attendance record with ID ${id} not found`);
      }
      return updated;
    }
  }

  /**
   * Admin: Delete attendance record
   */
  async deleteAttendance(id) {
    const isDbConnected = getDbStatus().isConnected;
    if (isDbConnected) {
      const deleted = await Attendance.findByIdAndDelete(id);
      if (!deleted) {
        throw ApiError.notFound(`Attendance record with ID ${id} not found`);
      }
      return { deleted: true, id };
    } else {
      const success = devAttendanceStore.delete(id);
      if (!success) {
        throw ApiError.notFound(`Attendance record with ID ${id} not found`);
      }
      return { deleted: true, id };
    }
  }
}

module.exports = new AttendanceService();
