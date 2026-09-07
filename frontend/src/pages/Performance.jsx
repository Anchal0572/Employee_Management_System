import React, { useState, useEffect } from 'react';
import {
  Target,
  Award,
  Star,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Edit3,
  MessageSquare,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { performanceService } from '../services/performanceService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const QUARTERS = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
const STATUSES = ['All', 'On Track', 'In Progress', 'Completed', 'Behind'];

export const Performance = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    quarter: 'Q1',
    year: 2026,
    targetMetric: '100%',
    currentMetric: '0%',
    progressPercent: 0,
    status: 'In Progress'
  });

  // Update Progress Modal
  const [editingGoal, setEditingGoal] = useState(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateMetric, setUpdateMetric] = useState('');
  const [managerFeedback, setManagerFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await performanceService.getGoals({
        quarter: selectedQuarter,
        status: selectedStatus
      });
      setGoals(res.goals);
      setScorecard(res.scorecard);
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [selectedQuarter, selectedStatus]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newGoal.title) return;

    setSubmitting(true);
    try {
      await performanceService.createGoal(newGoal);
      setIsCreateModalOpen(false);
      setNewGoal({
        title: '',
        description: '',
        quarter: 'Q1',
        year: 2026,
        targetMetric: '100%',
        currentMetric: '0%',
        progressPercent: 0,
        status: 'In Progress'
      });
      fetchPerformance();
    } catch (err) {
      console.error('Create goal failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgressSubmit = async (e) => {
    e.preventDefault();
    if (!editingGoal) return;

    setSubmitting(true);
    try {
      const payload = {
        progressPercent: Number(updateProgress),
        currentMetric: updateMetric || `${updateProgress}%`,
        status: Number(updateProgress) === 100 ? 'Completed' : 'In Progress'
      };
      if (user?.role === 'admin' && managerFeedback) {
        payload.managerFeedback = managerFeedback;
      }

      await performanceService.updateGoal(editingGoal._id, payload);
      setEditingGoal(null);
      fetchPerformance();
    } catch (err) {
      console.error('Update progress failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'On Track':
        return <Badge variant="info">On Track</Badge>;
      case 'Behind':
        return <Badge variant="danger">Behind</Badge>;
      default:
        return <Badge variant="warning">In Progress</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-purple-500/15 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Performance & OKR Scorecard</h1>
              <p className="text-xs text-purple-100 font-medium">
                Continuous goal tracking, competency evaluations, and merit appraisal recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4 text-purple-700" />
            <span>Create OKR Goal</span>
          </button>
        </div>
      </div>

      {/* 360 Appraisal Scorecard Grid */}
      {scorecard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Rating</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black text-slate-900">{scorecard.averageRating}</span>
                <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">OKR Completion</span>
              <div className="text-3xl font-black text-purple-600 mt-1">
                {scorecard.completionRate}%
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                {scorecard.activeGoalsCount} Tracked Objectives
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Appraisal Band</span>
              <div className="text-lg font-black text-emerald-600 mt-1 line-clamp-1">
                {scorecard.appraisalBand}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Top 5th Percentile
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recommended Hike</span>
              <div className="text-lg font-black text-indigo-600 mt-1">
                {scorecard.recommendedHike}
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                Annual Compensation Review
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Quarter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {QUARTERS.map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedQuarter === q
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {q === 'All' ? 'All Quarters' : q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Goal Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium text-xs">Loading performance objectives...</div>
      ) : goals.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No OKR goals found</h3>
          <p className="text-xs text-slate-400 mt-1">Create an objective to track key progress milestones.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <div
              key={g._id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-bold">
                      {g.quarter} {g.year}
                    </span>
                    {getStatusBadge(g.status)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{g.rating}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{g.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{g.description}</p>
                </div>

                {/* Animated Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 text-[11px]">Progress</span>
                    <span className="font-bold text-purple-600">{g.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                      style={{ width: `${g.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>Current: {g.currentMetric}</span>
                    <span>Target: {g.targetMetric}</span>
                  </div>
                </div>

                {g.managerFeedback && (
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-900">
                    <span className="font-bold block text-[10px] text-purple-700 uppercase">Manager Evaluation</span>
                    <p className="italic mt-0.5">"{g.managerFeedback}"</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Owner: <strong className="text-slate-700">{g.employeeName}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(g);
                    setUpdateProgress(g.progressPercent);
                    setUpdateMetric(g.currentMetric);
                    setManagerFeedback(g.managerFeedback || '');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Update Progress
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Performance Goal / OKR"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              label="Goal Objective Title"
              required
              placeholder="e.g. Implement Zero-Trust JWT Authentication"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Quarter
                </label>
                <select
                  value={newGoal.quarter}
                  onChange={(e) => setNewGoal({ ...newGoal, quarter: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800"
                >
                  <option value="Q1">Q1 (Jan - Mar)</option>
                  <option value="Q2">Q2 (Apr - Jun)</option>
                  <option value="Q3">Q3 (Jul - Sep)</option>
                  <option value="Q4">Q4 (Oct - Dec)</option>
                </select>
              </div>

              <Input
                label="Target Metric"
                placeholder="e.g. 100% Endpoints"
                value={newGoal.targetMetric}
                onChange={(e) => setNewGoal({ ...newGoal, targetMetric: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Objective Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe key results and milestone impact..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="bg-purple-600 hover:bg-purple-700">
                Save Objective
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Progress Modal */}
      {editingGoal && (
        <Modal
          isOpen={Boolean(editingGoal)}
          onClose={() => setEditingGoal(null)}
          title={`Update Progress: ${editingGoal.title}`}
        >
          <form onSubmit={handleUpdateProgressSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                <label className="text-slate-700">Progress: {updateProgress}%</label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={updateProgress}
                onChange={(e) => setUpdateProgress(e.target.value)}
                className="w-full accent-purple-600"
              />
            </div>

            <Input
              label="Current Metric String"
              placeholder="e.g. 4 of 5 APIs Completed"
              value={updateMetric}
              onChange={(e) => setUpdateMetric(e.target.value)}
            />

            {user?.role === 'admin' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Manager Review Feedback (360 Appraisal)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide manager coaching or evaluation feedback..."
                  value={managerFeedback}
                  onChange={(e) => setManagerFeedback(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditingGoal(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="bg-purple-600 hover:bg-purple-700">
                Save Progress
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Performance;
