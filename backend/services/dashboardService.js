const { Employee, Attendance, Leave, Payslip, User } = require('../models');
const { getDbStatus } = require('../config/db');
const ApiError = require('../utils/apiError');

// Standard Department Color Palette for Charts
const DEPARTMENT_COLORS = {
  'Engineering': '#4f46e5',     // Indigo
  'Human Resources': '#06b6d4', // Cyan
  'Finance': '#10b981',         // Emerald
  'Product': '#f59e0b',         // Amber
  'Legal': '#8b5cf6',           // Purple
  'Operations': '#ec4899',      // Pink
  'Marketing': '#3b82f6',       // Blue
  'Sales': '#f97316'            // Orange
};

const LEAVE_QUOTAS = {
  Earned: 18,
  Sick: 12,
  Casual: 10,
  Emergency: 5,
  Other: 5
};

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY SEED FALLBACK DATASETS
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_EMPLOYEES = [
  { _id: '66e1b0000000000000000001', employeeId: 'EMP-001', firstName: 'Sophia', lastName: 'Chen', name: 'Sophia Chen', email: 'sophia.chen@ems.corp', department: 'Engineering', designation: 'Staff Software Engineer', status: 'active', joiningDate: new Date('2023-01-15'), salary: 135000 },
  { _id: '66e1b0000000000000000002', employeeId: 'EMP-002', firstName: 'Marcus', lastName: 'Vance', name: 'Marcus Vance', email: 'marcus.v@ems.corp', department: 'Human Resources', designation: 'Director of Human Resources', status: 'active', joiningDate: new Date('2023-04-10'), salary: 145000 },
  { _id: '66e1b0000000000000000003', employeeId: 'EMP-003', firstName: 'Elena', lastName: 'Rostova', name: 'Elena Rostova', email: 'elena.r@ems.corp', department: 'Finance', designation: 'Financial Controller', status: 'active', joiningDate: new Date('2023-07-01'), salary: 120000 },
  { _id: '66e1b0000000000000000004', employeeId: 'EMP-004', firstName: 'David', lastName: 'Kim', name: 'David Kim', email: 'david.kim@ems.corp', department: 'Product', designation: 'Principal Product Manager', status: 'active', joiningDate: new Date('2023-11-20'), salary: 140000 },
  { _id: '66e1b0000000000000000005', employeeId: 'EMP-005', firstName: 'Amara', lastName: 'Okafor', name: 'Amara Okafor', email: 'amara.o@ems.corp', department: 'Engineering', designation: 'Senior Backend Engineer', status: 'active', joiningDate: new Date('2024-02-15'), salary: 130000 },
  { _id: '66e1b0000000000000000006', employeeId: 'EMP-006', firstName: 'Liam', lastName: 'Gallagher', name: 'Liam Gallagher', email: 'liam.g@ems.corp', department: 'Human Resources', designation: 'HR Business Partner', status: 'active', joiningDate: new Date('2024-06-01'), salary: 100000 },
  { _id: '66e1b0000000000000000007', employeeId: 'EMP-007', firstName: 'Priya', lastName: 'Nair', name: 'Priya Nair', email: 'priya.n@ems.corp', department: 'Product', designation: 'Senior UX Designer', status: 'active', joiningDate: new Date('2024-08-10'), salary: 115000 },
  { _id: '66e1b0000000000000000008', employeeId: 'EMP-008', firstName: 'Carlos', lastName: 'Mendez', name: 'Carlos Mendez', email: 'carlos.m@ems.corp', department: 'Legal', designation: 'Senior Corporate Counsel', status: 'active', joiningDate: new Date('2024-10-01'), salary: 138000 }
];

const FALLBACK_LEAVES = [
  { _id: '66e4a0000000000000000001', employeeId: 'EMP-001', employeeName: 'Sophia Chen', department: 'Engineering', leaveType: 'Earned', startDate: new Date('2026-09-10'), endDate: new Date('2026-09-12'), totalDays: 3, status: 'Pending', reason: 'Family trip', appliedAt: new Date('2026-09-02') },
  { _id: '66e4a0000000000000000002', employeeId: 'EMP-003', employeeName: 'Elena Rostova', department: 'Finance', leaveType: 'Casual', startDate: new Date('2026-08-15'), endDate: new Date('2026-08-16'), totalDays: 2, status: 'Approved', reason: 'Personal errands', appliedAt: new Date('2026-08-10') },
  { _id: '66e4a0000000000000000003', employeeId: 'EMP-004', employeeName: 'David Kim', department: 'Product', leaveType: 'Sick', startDate: new Date('2026-08-01'), endDate: new Date('2026-08-02'), totalDays: 2, status: 'Approved', reason: 'Viral infection', appliedAt: new Date('2026-07-31') },
  { _id: '66e4a0000000000000000004', employeeId: 'EMP-005', employeeName: 'Amara Okafor', department: 'Engineering', leaveType: 'Emergency', startDate: new Date('2026-09-05'), endDate: new Date('2026-09-06'), totalDays: 2, status: 'Pending', reason: 'Urgent family matter', appliedAt: new Date('2026-09-04') },
  { _id: '66e4a0000000000000000005', employeeId: 'EMP-007', employeeName: 'Priya Nair', department: 'Product', leaveType: 'Earned', startDate: new Date('2026-07-20'), endDate: new Date('2026-07-25'), totalDays: 5, status: 'Approved', reason: 'Annual vacation', appliedAt: new Date('2026-07-10') }
];

// Generate 14-day sample attendance history
const generateFallbackAttendance = () => {
  const records = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    FALLBACK_EMPLOYEES.forEach((emp, empIdx) => {
      let status = 'Present';
      let checkIn = new Date(d);
      checkIn.setHours(8, 45 + (empIdx * 4) % 30, 0);
      let checkOut = new Date(d);
      checkOut.setHours(17, 15 + (empIdx * 5) % 45, 0);
      let workingHours = 8.5;

      // Inject deterministic variation
      if ((i + empIdx) % 7 === 0) {
        status = 'Late';
        checkIn.setHours(9, 45, 0);
        workingHours = 7.5;
      } else if ((i + empIdx) % 11 === 0) {
        status = 'Absent';
        checkIn = null;
        checkOut = null;
        workingHours = 0;
      }

      records.push({
        _id: `att_${i}_${emp.employeeId}`,
        employee: emp._id,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        checkIn,
        checkOut,
        status,
        workingHours
      });
    });
  }
  return records;
};

const FALLBACK_ATTENDANCE = generateFallbackAttendance();

const FALLBACK_PAYROLL_MONTHS = [
  { month: '2026-04', grossSalary: 82500, netSalary: 64350, employeeCount: 8 },
  { month: '2026-05', grossSalary: 84000, netSalary: 65520, employeeCount: 8 },
  { month: '2026-06', grossSalary: 85500, netSalary: 66690, employeeCount: 8 },
  { month: '2026-07', grossSalary: 87000, netSalary: 67860, employeeCount: 8 },
  { month: '2026-08', grossSalary: 88500, netSalary: 69030, employeeCount: 8 },
  { month: '2026-09', grossSalary: 90000, netSalary: 70200, employeeCount: 8 }
];

class DashboardService {
  /**
   * Helper to parse date range filters
   */
  resolveDateRange(filters = {}) {
    const { dateRange = '30d', startDate, endDate } = filters;
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (startDate && !isNaN(new Date(startDate).getTime())) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
    } else {
      switch (dateRange) {
        case '7d':
          start.setDate(now.getDate() - 7);
          break;
        case '30d':
          start.setDate(now.getDate() - 30);
          break;
        case '90d':
          start.setDate(now.getDate() - 90);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          start = new Date('2020-01-01T00:00:00.000Z');
          break;
        default:
          start.setDate(now.getDate() - 30);
      }
      start.setHours(0, 0, 0, 0);
    }

    if (endDate && !isNaN(new Date(endDate).getTime())) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN DASHBOARD ANALYTICS (MongoDB Aggregations + Fallback)
  // ─────────────────────────────────────────────────────────────────────────

  async getAdminDashboard(filters = {}) {
    const isDbConnected = getDbStatus().isConnected;
    const { department } = filters;
    const { start, end } = this.resolveDateRange(filters);

    if (isDbConnected) {
      return await this.getAdminDashboardFromMongo({ department, start, end, filters });
    } else {
      return this.getAdminDashboardFromMemory({ department, start, end, filters });
    }
  }

  /**
   * Real-time aggregation pipelines using MongoDB
   */
  async getAdminDashboardFromMongo({ department, start, end, filters }) {
    const empMatch = {};
    if (department && department !== 'All' && department !== 'all') {
      empMatch.department = department;
    }

    const attMatch = {
      date: { $gte: start, $lte: end }
    };
    if (department && department !== 'All' && department !== 'all') {
      attMatch.department = department;
    }

    const leaveMatch = {};
    if (department && department !== 'All' && department !== 'all') {
      leaveMatch.department = department;
    }

    // 1. Employee Overview & Department Distribution
    const [empStats, deptDistribution, empGrowth] = await Promise.all([
      Employee.aggregate([
        { $match: empMatch },
        {
          $group: {
            _id: null,
            totalEmployees: { $sum: 1 },
            activeEmployees: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            newEmployees: {
              $sum: { $cond: [{ $gte: ['$joiningDate', start] }, 1, 0] }
            },
            totalSalaryMonthly: { $sum: { $divide: ['$salary', 12] } }
          }
        }
      ]),
      Employee.aggregate([
        { $match: empMatch },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Employee.aggregate([
        { $match: empMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$joiningDate' }
            },
            joiners: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // 2. Attendance Metrics & Daily Trend
    const [attStats, attDailyTrend] = await Promise.all([
      Attendance.aggregate([
        { $match: attMatch },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            presentCount: {
              $sum: { $cond: [{ $in: ['$status', ['Present', 'present']] }, 1, 0] }
            },
            lateCount: {
              $sum: { $cond: [{ $in: ['$status', ['Late', 'late']] }, 1, 0] }
            },
            absentCount: {
              $sum: { $cond: [{ $in: ['$status', ['Absent', 'absent']] }, 1, 0] }
            },
            halfDayCount: {
              $sum: { $cond: [{ $in: ['$status', ['Half Day', 'half_day']] }, 1, 0] }
            },
            totalHours: { $sum: '$workingHours' }
          }
        }
      ]),
      Attendance.aggregate([
        { $match: attMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' }
            },
            present: {
              $sum: { $cond: [{ $in: ['$status', ['Present', 'present']] }, 1, 0] }
            },
            late: {
              $sum: { $cond: [{ $in: ['$status', ['Late', 'late']] }, 1, 0] }
            },
            absent: {
              $sum: { $cond: [{ $in: ['$status', ['Absent', 'absent']] }, 1, 0] }
            },
            total: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // 3. Leave Metrics & Breakdown
    const [leaveStats, leaveByType, pendingLeavesList] = await Promise.all([
      Leave.aggregate([
        { $match: leaveMatch },
        {
          $group: {
            _id: null,
            pendingCount: {
              $sum: { $cond: [{ $in: ['$status', ['Pending', 'pending']] }, 1, 0] }
            },
            approvedDays: {
              $sum: {
                $cond: [{ $in: ['$status', ['Approved', 'approved']] }, '$totalDays', 0]
              }
            },
            totalRequests: { $sum: 1 }
          }
        }
      ]),
      Leave.aggregate([
        { $match: leaveMatch },
        {
          $group: {
            _id: '$leaveType',
            approved: {
              $sum: { $cond: [{ $in: ['$status', ['Approved', 'approved']] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $in: ['$status', ['Pending', 'pending']] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $in: ['$status', ['Rejected', 'rejected']] }, 1, 0] }
            },
            totalDays: { $sum: '$totalDays' }
          }
        }
      ]),
      Leave.find({ status: 'Pending', ...(department && department !== 'All' ? { department } : {}) })
        .sort({ appliedAt: -1 })
        .limit(5)
        .select('employeeName department leaveType startDate endDate totalDays reason appliedAt status')
    ]);

    // 4. Payroll Aggregation (Recent 6 months)
    const payrollMatch = {};
    if (department && department !== 'All' && department !== 'all') {
      payrollMatch.department = department;
    }

    const payrollOverview = await Payslip.aggregate([
      { $match: payrollMatch },
      {
        $group: {
          _id: '$salaryMonth',
          grossSalary: { $sum: '$grossSalary' },
          netSalary: { $sum: '$netSalary' },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // Format results
    const empAgg = empStats[0] || { totalEmployees: 0, activeEmployees: 0, newEmployees: 0, totalSalaryMonthly: 0 };
    const attAgg = attStats[0] || { totalRecords: 0, presentCount: 0, lateCount: 0, absentCount: 0, halfDayCount: 0, totalHours: 0 };
    const leaveAgg = leaveStats[0] || { pendingCount: 0, approvedDays: 0, totalRequests: 0 };

    const totalAtt = attAgg.totalRecords || 0;
    const attendanceRate = totalAtt > 0
      ? Math.min(100, Math.round(((attAgg.presentCount + attAgg.lateCount) / totalAtt) * 100))
      : 0;
    const absenteeism = totalAtt > 0
      ? Math.round((attAgg.absentCount / totalAtt) * 100)
      : 0;
    const lateArrivals = attAgg.lateCount || 0;

    const formattedDept = deptDistribution.map((d) => ({
      name: d._id || 'General',
      count: d.count,
      percentage: empAgg.totalEmployees > 0 ? Math.round((d.count / empAgg.totalEmployees) * 100) : 0,
      color: DEPARTMENT_COLORS[d._id] || '#6366f1'
    }));

    const formattedAttTrend = attDailyTrend.map((d) => {
      const dt = new Date(d._id);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const rate = d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 0;
      return {
        date: d._id,
        day: dayName,
        present: d.present,
        late: d.late,
        absent: d.absent,
        presentRate: rate
      };
    });

    return {
      kpis: {
        totalEmployees: empAgg.totalEmployees,
        activeEmployees: empAgg.activeEmployees,
        newEmployees: empAgg.newEmployees,
        attendanceRate,
        absenteeism,
        lateArrivals,
        pendingLeaves: leaveAgg.pendingCount,
        leaveUtilization: leaveAgg.approvedDays,
        monthlyPayroll: Math.round(empAgg.totalSalaryMonthly || 0)
      },
      charts: {
        attendanceTrend: formattedAttTrend,
        departmentDistribution: formattedDept,
        leaveStatistics: leaveByType.map(l => ({
          type: l._id,
          approved: l.approved,
          pending: l.pending,
          rejected: l.rejected,
          totalDays: l.totalDays
        })),
        employeeGrowth: empGrowth.map(g => ({ month: g._id, count: g.joiners })),
        payrollOverview: payrollOverview.map(p => ({
          month: p._id,
          grossSalary: p.grossSalary,
          netSalary: p.netSalary,
          employeeCount: p.employeeCount
        }))
      },
      recentPendingLeaves: pendingLeavesList
    };
  }

  /**
   * Fast In-Memory calculations for local dev mode
   */
  getAdminDashboardFromMemory({ department, start, end }) {
    let employees = [...FALLBACK_EMPLOYEES];
    if (department && department !== 'All' && department !== 'all') {
      employees = employees.filter(e => e.department === department);
    }

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    const newEmployees = employees.filter(e => new Date(e.joiningDate) >= start).length;
    const monthlyPayroll = Math.round(employees.reduce((acc, e) => acc + (e.salary / 12), 0));

    // Attendance records in range
    let attendance = [...FALLBACK_ATTENDANCE];
    if (department && department !== 'All' && department !== 'all') {
      attendance = attendance.filter(a => a.department === department);
    }
    attendance = attendance.filter(a => {
      const t = new Date(a.date).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const totalRecords = attendance.length || 1;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const lateCount = attendance.filter(a => a.status === 'Late').length;
    const absentCount = attendance.filter(a => a.status === 'Absent').length;

    const attendanceRate = Math.round(((presentCount + lateCount) / totalRecords) * 100);
    const absenteeism = Math.round((absentCount / totalRecords) * 100);

    // Leaves
    let leaves = [...FALLBACK_LEAVES];
    if (department && department !== 'All' && department !== 'all') {
      leaves = leaves.filter(l => l.department === department);
    }
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
    const leaveUtilization = leaves
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + l.totalDays, 0);

    // Department Distribution
    const deptMap = {};
    FALLBACK_EMPLOYEES.forEach(emp => {
      deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptMap).map(([dept, count]) => ({
      name: dept,
      count,
      percentage: Math.round((count / FALLBACK_EMPLOYEES.length) * 100),
      color: DEPARTMENT_COLORS[dept] || '#6366f1'
    }));

    // Daily Attendance Trend
    const dailyMap = {};
    attendance.forEach(rec => {
      const dateStr = new Date(rec.date).toISOString().slice(0, 10);
      if (!dailyMap[dateStr]) {
        const dt = new Date(rec.date);
        dailyMap[dateStr] = {
          date: dateStr,
          day: dt.toLocaleDateString('en-US', { weekday: 'short' }),
          present: 0,
          late: 0,
          absent: 0,
          total: 0
        };
      }
      dailyMap[dateStr].total++;
      if (rec.status === 'Present') dailyMap[dateStr].present++;
      else if (rec.status === 'Late') dailyMap[dateStr].late++;
      else if (rec.status === 'Absent') dailyMap[dateStr].absent++;
    });

    const attendanceTrend = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        presentRate: d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 100
      }));

    // Leave statistics by type
    const leaveStatsMap = {};
    Object.keys(LEAVE_QUOTAS).forEach(t => {
      leaveStatsMap[t] = { type: t, approved: 0, pending: 0, rejected: 0, totalDays: 0 };
    });
    leaves.forEach(l => {
      const t = l.leaveType || 'Other';
      if (!leaveStatsMap[t]) {
        leaveStatsMap[t] = { type: t, approved: 0, pending: 0, rejected: 0, totalDays: 0 };
      }
      if (l.status === 'Approved') leaveStatsMap[t].approved++;
      else if (l.status === 'Pending') leaveStatsMap[t].pending++;
      else if (l.status === 'Rejected') leaveStatsMap[t].rejected++;
      leaveStatsMap[t].totalDays += l.totalDays;
    });

    // Employee growth over past 6 months
    const growth = [
      { month: '2026-04', joiners: 1, count: 5 },
      { month: '2026-05', joiners: 0, count: 5 },
      { month: '2026-06', joiners: 1, count: 6 },
      { month: '2026-07', joiners: 0, count: 6 },
      { month: '2026-08', joiners: 1, count: 7 },
      { month: '2026-09', joiners: 1, count: 8 }
    ];

    const recentPendingLeaves = leaves
      .filter(l => l.status === 'Pending')
      .slice(0, 5);

    return {
      kpis: {
        totalEmployees,
        activeEmployees,
        newEmployees,
        attendanceRate,
        absenteeism,
        lateArrivals: lateCount,
        pendingLeaves,
        leaveUtilization,
        monthlyPayroll
      },
      charts: {
        attendanceTrend: attendanceTrend.length > 0 ? attendanceTrend : this.generateAttendanceTrendFallback(),
        departmentDistribution,
        leaveStatistics: Object.values(leaveStatsMap),
        employeeGrowth: growth,
        payrollOverview: FALLBACK_PAYROLL_MONTHS
      },
      recentPendingLeaves
    };
  }

  generateAttendanceTrendFallback() {
    return [
      { day: 'Mon', date: '2026-09-01', presentRate: 94, present: 7, late: 1, absent: 0 },
      { day: 'Tue', date: '2026-09-02', presentRate: 88, present: 6, late: 1, absent: 1 },
      { day: 'Wed', date: '2026-09-03', presentRate: 100, present: 8, late: 0, absent: 0 },
      { day: 'Thu', date: '2026-09-04', presentRate: 92, present: 7, late: 1, absent: 0 },
      { day: 'Fri', date: '2026-09-05', presentRate: 88, present: 6, late: 1, absent: 1 }
    ];
  }

  generateDeptDistributionFallback() {
    return [
      { name: 'Engineering', count: 3, percentage: 38, color: '#4f46e5' },
      { name: 'Product', count: 2, percentage: 25, color: '#f59e0b' },
      { name: 'Human Resources', count: 2, percentage: 25, color: '#06b6d4' },
      { name: 'Finance', count: 1, percentage: 12, color: '#10b981' }
    ];
  }

  generateLeaveStatisticsFallback() {
    return [
      { type: 'Earned', approved: 4, pending: 1, rejected: 0, totalDays: 14 },
      { type: 'Sick', approved: 2, pending: 0, rejected: 1, totalDays: 5 },
      { type: 'Casual', approved: 3, pending: 1, rejected: 0, totalDays: 4 },
      { type: 'Emergency', approved: 1, pending: 1, rejected: 0, totalDays: 2 },
      { type: 'Other', approved: 0, pending: 0, rejected: 0, totalDays: 0 }
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EMPLOYEE DASHBOARD ANALYTICS (Personalized)
  // ─────────────────────────────────────────────────────────────────────────

  async getEmployeeDashboard(user) {
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      return await this.getEmployeeDashboardFromMongo(user);
    } else {
      return this.getEmployeeDashboardFromMemory(user);
    }
  }

  async getEmployeeDashboardFromMongo(user) {
    // Resolve employee
    let employee = null;
    if (user._id) {
      employee = await Employee.findOne({ user: user._id });
    }
    if (!employee && user.email) {
      employee = await Employee.findOne({ email: user.email });
    }
    if (!employee && user.employeeId) {
      employee = await Employee.findOne({ employeeId: user.employeeId });
    }

    const empId = employee ? employee._id : null;
    const empIdStr = employee ? employee.employeeId : user.employeeId || 'EMP-001';

    // 1. Personal Attendance aggregation (past 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [attStats, personalTrend, leaveUsage, latestPayslip] = await Promise.all([
      Attendance.aggregate([
        {
          $match: {
            $or: [
              ...(empId ? [{ employee: empId }] : []),
              { employeeId: empIdStr }
            ],
            date: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: { $cond: [{ $in: ['$status', ['Present', 'present']] }, 1, 0] }
            },
            lateDays: {
              $sum: { $cond: [{ $in: ['$status', ['Late', 'late']] }, 1, 0] }
            },
            absentDays: {
              $sum: { $cond: [{ $in: ['$status', ['Absent', 'absent']] }, 1, 0] }
            },
            totalHours: { $sum: '$workingHours' }
          }
        }
      ]),
      Attendance.find({
        $or: [
          ...(empId ? [{ employee: empId }] : []),
          { employeeId: empIdStr }
        ]
      })
        .sort({ date: -1 })
        .limit(10)
        .select('date checkIn checkOut status workingHours'),
      Leave.find({
        $or: [
          ...(empId ? [{ employee: empId }] : []),
          { employeeId: empIdStr }
        ]
      }).sort({ appliedAt: -1 }),
      Payslip.findOne({
        $or: [
          ...(empId ? [{ employee: empId }] : []),
          { employeeId: empIdStr }
        ]
      }).sort({ salaryMonth: -1 })
    ]);

    const att = attStats[0] || { totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, totalHours: 0 };
    const totalWorking = att.totalDays || 0;
    const attendanceRate = totalWorking > 0
      ? Math.round(((att.presentDays + att.lateDays) / totalWorking) * 100)
      : 0;
    const averageWorkingHours = totalWorking > 0
      ? parseFloat((att.totalHours / totalWorking).toFixed(1))
      : 0;

    // Calculate Leave Balances
    const leaveBalances = {};
    Object.entries(LEAVE_QUOTAS).forEach(([type, quota]) => {
      const used = leaveUsage
        .filter(l => l.leaveType === type && l.status === 'Approved')
        .reduce((sum, l) => sum + l.totalDays, 0);
      const pending = leaveUsage
        .filter(l => l.leaveType === type && l.status === 'Pending')
        .reduce((sum, l) => sum + l.totalDays, 0);
      leaveBalances[type] = {
        quota,
        used,
        pending,
        remaining: Math.max(0, quota - used)
      };
    });

    const formattedTrend = personalTrend.map(r => {
      const d = new Date(r.date);
      return {
        date: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        status: r.status,
        hoursWorked: r.workingHours || 0,
        checkIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'
      };
    }).reverse();

    return {
      profile: {
        name: employee?.name || user.name || 'Employee Member',
        employeeId: empIdStr,
        department: employee?.department || user.department || 'Engineering',
        designation: employee?.designation || user.designation || 'Staff Member',
        avatar: employee?.avatar || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      personalStats: {
        attendanceRate,
        daysPresent: att.presentDays,
        lateArrivals: att.lateDays,
        absences: att.absentDays,
        averageWorkingHours
      },
      leaveBalances,
      attendanceTrend: formattedTrend,
      myRecentLeaves: leaveUsage.slice(0, 5),
      latestPayslip: latestPayslip ? {
        id: latestPayslip._id,
        salaryMonth: latestPayslip.salaryMonth,
        grossSalary: latestPayslip.grossSalary,
        netSalary: latestPayslip.netSalary,
        totalDeductions: latestPayslip.totalDeductions,
        totalAllowances: latestPayslip.totalAllowances,
        paymentStatus: latestPayslip.paymentStatus,
        paymentDate: latestPayslip.paymentDate,
        bankAccount: latestPayslip.bankAccount
      } : null
    };
  }

  getEmployeeDashboardFromMemory(user) {
    const empId = user.employeeId || 'EMP-001';
    const employee = FALLBACK_EMPLOYEES.find(e => e.employeeId === empId || e.email === user.email) || FALLBACK_EMPLOYEES[0];

    const myAttendance = FALLBACK_ATTENDANCE.filter(a => a.employeeId === employee.employeeId);
    const myLeaves = FALLBACK_LEAVES.filter(l => l.employeeId === employee.employeeId);

    const totalRecords = myAttendance.length || 1;
    const daysPresent = myAttendance.filter(a => a.status === 'Present').length;
    const lateArrivals = myAttendance.filter(a => a.status === 'Late').length;
    const absences = myAttendance.filter(a => a.status === 'Absent').length;
    const totalHours = myAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);

    const attendanceRate = Math.round(((daysPresent + lateArrivals) / totalRecords) * 100);
    const averageWorkingHours = totalRecords > 0 ? parseFloat((totalHours / totalRecords).toFixed(1)) : 8.4;

    const leaveBalances = {};
    Object.entries(LEAVE_QUOTAS).forEach(([type, quota]) => {
      const used = myLeaves
        .filter(l => l.leaveType === type && l.status === 'Approved')
        .reduce((sum, l) => sum + l.totalDays, 0);
      const pending = myLeaves
        .filter(l => l.leaveType === type && l.status === 'Pending')
        .reduce((sum, l) => sum + l.totalDays, 0);
      leaveBalances[type] = {
        quota,
        used,
        pending,
        remaining: Math.max(0, quota - used)
      };
    });

    const attendanceTrend = myAttendance.slice(-7).map(r => {
      const d = new Date(r.date);
      return {
        date: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        status: r.status,
        hoursWorked: r.workingHours || 0,
        checkIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'
      };
    });

    return {
      profile: {
        name: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
        designation: employee.designation,
        avatar: employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      personalStats: {
        attendanceRate,
        daysPresent,
        lateArrivals,
        absences,
        averageWorkingHours
      },
      leaveBalances,
      attendanceTrend: attendanceTrend.length > 0 ? attendanceTrend : this.generatePersonalTrendFallback(),
      myRecentLeaves: myLeaves,
      latestPayslip: this.generatePersonalPayslipFallback(employee)
    };
  }

  generatePersonalTrendFallback() {
    return [
      { date: '2026-09-01', day: 'Mon', hoursWorked: 8.5, status: 'Present', checkIn: '08:55 AM', checkOut: '05:30 PM' },
      { date: '2026-09-02', day: 'Tue', hoursWorked: 8.6, status: 'Present', checkIn: '08:52 AM', checkOut: '05:35 PM' },
      { date: '2026-09-03', day: 'Wed', hoursWorked: 7.8, status: 'Late', checkIn: '09:42 AM', checkOut: '05:30 PM' },
      { date: '2026-09-04', day: 'Thu', hoursWorked: 8.5, status: 'Present', checkIn: '08:50 AM', checkOut: '05:25 PM' },
      { date: '2026-09-05', day: 'Fri', hoursWorked: 8.7, status: 'Present', checkIn: '08:48 AM', checkOut: '05:40 PM' }
    ];
  }

  generatePersonalPayslipFallback(emp) {
    const basic = emp ? emp.salary / 12 : 11250;
    const gross = Math.round(basic * 1.38);
    const deductions = Math.round(basic * 0.15);
    const tax = Math.round(gross * 0.18);
    return {
      id: '66e5a0000000000000000001',
      salaryMonth: '2026-08',
      grossSalary: gross,
      netSalary: gross - deductions - tax,
      totalDeductions: deductions + tax,
      totalAllowances: Math.round(basic * 0.38),
      paymentStatus: 'Paid',
      paymentDate: '2026-08-28',
      bankAccount: '•••• •••• •••• 4892'
    };
  }
}

module.exports = new DashboardService();
