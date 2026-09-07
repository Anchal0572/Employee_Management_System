const { getDbStatus } = require('../config/db');
const Goal = require('../models/Goal');
const ApiError = require('../utils/apiError');

const INITIAL_GOALS = [
  {
    _id: '66e1g0000000000000000001',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    title: 'Migrate Core Payment Service to Event-Driven Microservices',
    description: 'Transition monolithic payment endpoints to asynchronous Inngest queues with sub-50ms latency.',
    quarter: 'Q1',
    year: 2026,
    targetMetric: '100% Endpoints Migrated',
    currentMetric: '85% Complete (4 of 5 APIs)',
    progressPercent: 85,
    status: 'On Track',
    rating: 4.9,
    managerFeedback: 'Exceptional architectural rigor and zero-downtime execution.',
    createdAt: new Date('2026-01-10')
  },
  {
    _id: '66e1g0000000000000000002',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    title: 'Mentor Junior Engineers & Conduct 8 System Design Workshops',
    description: 'Host weekly architecture guild sessions and pair programming with associate backend engineers.',
    quarter: 'Q1',
    year: 2026,
    targetMetric: '8 Sessions Conducted',
    currentMetric: '6 Sessions Complete',
    progressPercent: 75,
    status: 'On Track',
    rating: 4.8,
    managerFeedback: 'Strong technical leadership and high mentee satisfaction scores.',
    createdAt: new Date('2026-01-15')
  },
  {
    _id: '66e1g0000000000000000003',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    title: 'Achieve 90%+ Automated Integration Test Suite Coverage',
    description: 'Build comprehensive Jest and Supertest suites across auth, leave, attendance, and payroll modules.',
    quarter: 'Q1',
    year: 2026,
    targetMetric: '90% Branch Coverage',
    currentMetric: '92% Test Coverage Achieved',
    progressPercent: 100,
    status: 'Completed',
    rating: 5.0,
    managerFeedback: 'Exceeded target ahead of schedule; established testing best practices for whole team.',
    createdAt: new Date('2026-01-05')
  },
  {
    _id: '66e1g0000000000000000004',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Vance',
    department: 'Human Resources',
    title: 'Reduce Time-to-Hire to Under 21 Days Across Technical Roles',
    description: 'Streamline sourcing pipelines and implement standardized hiring rubrics.',
    quarter: 'Q1',
    year: 2026,
    targetMetric: 'Avg. 21 Days',
    currentMetric: '19.4 Days Current Avg.',
    progressPercent: 90,
    status: 'On Track',
    rating: 4.7,
    managerFeedback: 'Noticeable velocity improvement in hiring engineering talent.',
    createdAt: new Date('2026-01-12')
  }
];

class PerformanceMemoryStore {
  constructor() {
    this.goals = new Map();
    INITIAL_GOALS.forEach((g) => this.goals.set(g._id, { ...g }));
  }

  findAll({ role, employeeId, quarter, status }) {
    let list = Array.from(this.goals.values());

    if (role !== 'admin') {
      list = list.filter((g) => g.employeeId === employeeId);
    }

    if (quarter && quarter !== 'All') {
      list = list.filter((g) => g.quarter === quarter);
    }

    if (status && status !== 'All') {
      list = list.filter((g) => g.status === status);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  findById(id) {
    return this.goals.get(id) || null;
  }

  create(data) {
    const newG = {
      _id: '66e1g0000000000' + (this.goals.size + 1).toString().padStart(9, '0'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.goals.set(newG._id, newG);
    return newG;
  }

  update(id, data) {
    const existing = this.goals.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    this.goals.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.goals.delete(id);
  }

  getScorecard(employeeId) {
    const employeeGoals = Array.from(this.goals.values()).filter((g) => g.employeeId === employeeId);
    const avgRating = employeeGoals.length
      ? (employeeGoals.reduce((sum, g) => sum + (g.rating || 4), 0) / employeeGoals.length).toFixed(1)
      : '4.8';
    const avgProgress = employeeGoals.length
      ? Math.round(employeeGoals.reduce((sum, g) => sum + (g.progressPercent || 0), 0) / employeeGoals.length)
      : 85;

    return {
      averageRating: parseFloat(avgRating),
      completionRate: avgProgress,
      activeGoalsCount: employeeGoals.length,
      competencies: [
        { name: 'Technical Execution', score: 98, band: 'Top 5%' },
        { name: 'System Architecture', score: 95, band: 'Top 5%' },
        { name: 'Mentorship & Culture', score: 92, band: 'Top 10%' },
        { name: 'Operational Discipline', score: 96, band: 'Top 5%' }
      ],
      appraisalBand: parseFloat(avgRating) >= 4.5 ? 'Distinguished (Top Tier)' : 'Strong Contributor',
      recommendedHike: parseFloat(avgRating) >= 4.8 ? '12% - 15% (Merit Band A)' : '8% - 10% (Merit Band B)'
    };
  }
}

const devStore = new PerformanceMemoryStore();

class PerformanceService {
  async getGoals({ user, quarter, status }) {
    const isDbConnected = getDbStatus().isConnected;

    if (!isDbConnected) {
      const goals = devStore.findAll({
        role: user.role,
        employeeId: user.employeeId,
        quarter,
        status
      });
      const scorecard = devStore.getScorecard(user.employeeId || 'EMP-001');
      return { goals, scorecard };
    }

    const filter = {};
    if (user.role !== 'admin') {
      filter.employeeId = user.employeeId;
    }
    if (quarter && quarter !== 'All') {
      filter.quarter = quarter;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    const scorecard = devStore.getScorecard(user.employeeId || 'EMP-001');

    return { goals, scorecard };
  }

  async createGoal(data, user) {
    const isDbConnected = getDbStatus().isConnected;

    const payload = {
      employeeId: user.role === 'admin' && data.employeeId ? data.employeeId : user.employeeId,
      employeeName: user.role === 'admin' && data.employeeName ? data.employeeName : user.name,
      department: data.department || user.department || 'Engineering',
      title: data.title,
      description: data.description || '',
      quarter: data.quarter || 'Q1',
      year: data.year || 2026,
      targetMetric: data.targetMetric || '100%',
      currentMetric: data.currentMetric || '0%',
      progressPercent: Number(data.progressPercent || 0),
      status: data.status || 'In Progress',
      rating: Number(data.rating || 4.5),
      managerFeedback: data.managerFeedback || ''
    };

    if (!isDbConnected) {
      return devStore.create(payload);
    }

    const goal = new Goal(payload);
    return await goal.save();
  }

  async updateGoal(id, data, user) {
    const isDbConnected = getDbStatus().isConnected;

    if (!isDbConnected) {
      const updated = devStore.update(id, data);
      if (!updated) throw ApiError.notFound('Goal not found');
      return updated;
    }

    const updated = await Goal.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw ApiError.notFound('Goal not found');
    return updated;
  }
}

module.exports = new PerformanceService();
