const {
  ragService,
  attendanceInsightsService,
  leaveInsightsService,
  employeeInsightsService
} = require('../../ai-service/services');
const { Employee, Attendance, Leave } = require('../models');
const { getDbStatus } = require('../config/db');

// Fallback seed records for in-memory dev / testing
const FALLBACK_EMPLOYEES = [
  { _id: '66e1b0000000000000000001', employeeId: 'EMP-001', firstName: 'Sophia', lastName: 'Chen', name: 'Sophia Chen', department: 'Engineering', status: 'active' },
  { _id: '66e1b0000000000000000002', employeeId: 'EMP-002', firstName: 'Marcus', lastName: 'Vance', name: 'Marcus Vance', department: 'Human Resources', status: 'active' },
  { _id: '66e1b0000000000000000003', employeeId: 'EMP-003', firstName: 'Elena', lastName: 'Rostova', name: 'Elena Rostova', department: 'Finance', status: 'active' },
  { _id: '66e1b0000000000000000004', employeeId: 'EMP-004', firstName: 'David', lastName: 'Kim', name: 'David Kim', department: 'Product', status: 'active' }
];

const FALLBACK_LEAVES = [
  { _id: '66e4a0000000000000000001', employeeName: 'Sophia Chen', department: 'Engineering', leaveType: 'Earned', status: 'Pending', totalDays: 3 },
  { _id: '66e4a0000000000000000002', employeeName: 'Elena Rostova', department: 'Finance', leaveType: 'Casual', status: 'Approved', totalDays: 2 },
  { _id: '66e4a0000000000000000003', employeeName: 'David Kim', department: 'Product', leaveType: 'Sick', status: 'Pending', totalDays: 2 },
  { _id: '66e4a0000000000000000004', employeeName: 'Marcus Vance', department: 'Human Resources', leaveType: 'Earned', status: 'Approved', totalDays: 1 }
];

const FALLBACK_ATTENDANCE = [
  { employeeName: 'Sophia Chen', department: 'Engineering', status: 'present', date: new Date() },
  { employeeName: 'Marcus Vance', department: 'Human Resources', status: 'present', date: new Date() },
  { employeeName: 'Elena Rostova', department: 'Finance', status: 'late', date: new Date() },
  { employeeName: 'David Kim', department: 'Product', status: 'present', date: new Date() },
  { employeeName: 'Sophia Chen', department: 'Engineering', status: 'late', date: new Date(Date.now() - 86400000) },
  { employeeName: 'Elena Rostova', department: 'Finance', status: 'absent', date: new Date(Date.now() - 86400000) },
  { employeeName: 'David Kim', department: 'Product', status: 'present', date: new Date(Date.now() - 86400000) },
  { employeeName: 'Marcus Vance', department: 'Human Resources', status: 'present', date: new Date(Date.now() - 86400000) }
];

/**
 * Safely fetches recent attendance records
 */
async function getAttendanceData() {
  try {
    const status = getDbStatus();
    if (status && status.isConnected && Attendance) {
      const records = await Attendance.find().sort({ date: -1 }).limit(200).lean();
      if (records && records.length > 0) return records;
    }
  } catch (err) {
    console.warn('[AIController] Attendance query fallback:', err.message);
  }
  return FALLBACK_ATTENDANCE;
}

/**
 * Safely fetches leave records
 */
async function getLeaveData() {
  try {
    const status = getDbStatus();
    if (status && status.isConnected && Leave) {
      const records = await Leave.find().sort({ createdAt: -1 }).limit(100).lean();
      if (records && records.length > 0) return records;
    }
  } catch (err) {
    console.warn('[AIController] Leave query fallback:', err.message);
  }
  return FALLBACK_LEAVES;
}

/**
 * Safely fetches active employees
 */
async function getEmployeeData() {
  try {
    const status = getDbStatus();
    if (status && status.isConnected && Employee) {
      const records = await Employee.find({ status: 'active' }).lean();
      if (records && records.length > 0) return records;
    }
  } catch (err) {
    console.warn('[AIController] Employee query fallback:', err.message);
  }
  return FALLBACK_EMPLOYEES;
}

/**
 * GET /api/ai/insights/dashboard
 * Aggregates unified AI insights for the Admin Dashboard
 */
exports.getDashboardInsights = async (req, res, next) => {
  try {
    const [attendanceRecords, leaves, employees] = await Promise.all([
      getAttendanceData(),
      getLeaveData(),
      getEmployeeData()
    ]);

    const attInsights = attendanceInsightsService.generateInsights(attendanceRecords, employees);
    const leaveInsights = leaveInsightsService.generateInsights(leaves, employees);

    const allInsights = [...attInsights, ...leaveInsights];

    // Compute severity counts
    const counts = {
      high: allInsights.filter(i => i.severity === 'high').length,
      medium: allInsights.filter(i => i.severity === 'medium').length,
      low: allInsights.filter(i => i.severity === 'low').length,
      total: allInsights.length
    };

    // Synthesize executive briefing
    const presentCount = attendanceRecords.filter(r => (r.status || '').toLowerCase() === 'present').length;
    const attRate = attendanceRecords.length ? Math.round((presentCount / attendanceRecords.length) * 100) : 92;
    const pendingCount = leaves.filter(l => (l.status || '').toLowerCase() === 'pending').length;
    const lateCount = attendanceRecords.filter(r => (r.status || '').toLowerCase() === 'late').length;

    const summary = employeeInsightsService.generateExecutiveSummary({
      attendanceStats: { attendanceRate: attRate, lateArrivals: lateCount },
      leaveStats: { pendingLeaves: pendingCount },
      headcountStats: { totalEmployees: employees.length, activeEmployees: employees.length }
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        insights: allInsights,
        counts,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ai/insights/attendance
 */
exports.getAttendanceInsights = async (req, res, next) => {
  try {
    const [attendanceRecords, employees] = await Promise.all([
      getAttendanceData(),
      getEmployeeData()
    ]);

    const insights = attendanceInsightsService.generateInsights(attendanceRecords, employees);
    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ai/insights/leaves
 */
exports.getLeaveInsights = async (req, res, next) => {
  try {
    const [leaves, employees] = await Promise.all([
      getLeaveData(),
      getEmployeeData()
    ]);

    const insights = leaveInsightsService.generateInsights(leaves, employees);
    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/assistant/chat
 * Policy Q&A with RAG retrieval and strict RBAC guardrails
 */
exports.chatWithAssistant = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A message question string is required.'
      });
    }

    // Current authenticated user context
    const user = {
      id: req.user?._id || req.user?.id,
      role: req.user?.role || 'employee',
      name: req.user?.name || req.user?.email || 'Employee',
      email: req.user?.email
    };

    const response = await ragService.answerQuery({
      query: message,
      user,
      history: history || []
    });

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ai/knowledge/documents
 */
exports.getKnowledgeDocuments = async (req, res, next) => {
  try {
    const documents = ragService.getIndexedDocuments();
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/knowledge/reindex
 */
exports.reindexKnowledge = async (req, res, next) => {
  try {
    const stats = ragService.reindexDocuments();
    res.status(200).json({
      success: true,
      message: 'Knowledge base documents re-indexed successfully.',
      data: stats
    });
  } catch (err) {
    next(err);
  }
};
