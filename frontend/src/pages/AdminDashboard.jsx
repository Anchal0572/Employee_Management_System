import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CalendarClock,
  DollarSign,
  Percent,
  TrendingUp,
  Plus,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { dashboardService } from '../services/dashboardService';
import { aiService } from '../services/aiService';
import {
  Sparkles,
  BrainCircuit,
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const DEPARTMENTS = [
  { value: 'All', label: 'All Departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Product', label: 'Product' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' }
];

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'Past Year' }
];

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [department, setDepartment] = useState('All');
  const [dateRange, setDateRange] = useState('30d');

  // AI Insights State
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiFilter, setAiFilter] = useState('all');

  const fetchAiData = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await aiService.getDashboardInsights();
      setAiData(res);
    } catch (err) {
      console.warn('Could not load AI insights:', err.message);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [dashRes] = await Promise.all([
        dashboardService.getAdminDashboard({ department, dateRange }),
        fetchAiData()
      ]);
      setData(dashRes);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      setError(err.message || 'Unable to load real-time analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department, dateRange, fetchAiData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpis = data?.kpis || {
    totalEmployees: 0,
    activeEmployees: 0,
    newEmployees: 0,
    attendanceRate: 0,
    absenteeism: 0,
    lateArrivals: 0,
    pendingLeaves: 0,
    leaveUtilization: 0,
    monthlyPayroll: 0
  };

  const charts = data?.charts || {
    attendanceTrend: [],
    departmentDistribution: [],
    leaveStatistics: [],
    employeeGrowth: [],
    payrollOverview: []
  };

  const recentPendingLeaves = data?.recentPendingLeaves || [];

  const statCards = [
    {
      label: 'Total Workforce',
      value: kpis.totalEmployees,
      subtext: `${kpis.activeEmployees} active • ${kpis.newEmployees} new this period`,
      icon: Users,
      cardBg: 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100/60',
      border: 'border-indigo-200/90 hover:border-indigo-400',
      iconBox: 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25',
      valueColor: 'text-indigo-950',
      glow: 'hover:shadow-indigo-500/20 shadow-xs'
    },
    {
      label: 'Attendance Rate',
      value: `${kpis.attendanceRate}%`,
      subtext: 'Average across scheduled shifts',
      icon: Percent,
      cardBg: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60',
      border: 'border-emerald-200/90 hover:border-emerald-400',
      iconBox: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25',
      valueColor: 'text-emerald-950',
      glow: 'hover:shadow-emerald-500/20 shadow-xs'
    },
    {
      label: 'Absenteeism',
      value: `${kpis.absenteeism}%`,
      subtext: `${kpis.lateArrivals} late arrival${kpis.lateArrivals === 1 ? '' : 's'} recorded`,
      icon: UserX,
      cardBg: 'bg-gradient-to-br from-rose-50 via-white to-rose-100/60',
      border: 'border-rose-200/90 hover:border-rose-400',
      iconBox: 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25',
      valueColor: 'text-rose-950',
      glow: 'hover:shadow-rose-500/20 shadow-xs'
    },
    {
      label: 'Pending Leaves',
      value: kpis.pendingLeaves,
      subtext: `${kpis.leaveUtilization} total approved leave days`,
      icon: CalendarClock,
      cardBg: 'bg-gradient-to-br from-amber-50 via-white to-amber-100/60',
      border: 'border-amber-200/90 hover:border-amber-400',
      iconBox: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25',
      valueColor: 'text-amber-950',
      glow: 'hover:shadow-amber-500/20 shadow-xs'
    },
    {
      label: 'Monthly Payroll',
      value: `$${Number(kpis.monthlyPayroll || 0).toLocaleString()}`,
      subtext: 'Calculated baseline liability',
      icon: DollarSign,
      cardBg: 'bg-gradient-to-br from-violet-50 via-white to-purple-100/60',
      border: 'border-violet-200/90 hover:border-violet-400',
      iconBox: 'bg-gradient-to-tr from-violet-600 to-purple-500 text-white shadow-md shadow-violet-500/25',
      valueColor: 'text-violet-950',
      glow: 'hover:shadow-violet-500/20 shadow-xs'
    },
    {
      label: 'Active Retention',
      value: kpis.totalEmployees > 0 ? `${Math.round((kpis.activeEmployees / kpis.totalEmployees) * 100)}%` : '100%',
      subtext: 'Healthy operational baseline',
      icon: TrendingUp,
      cardBg: 'bg-gradient-to-br from-sky-50 via-white to-cyan-100/60',
      border: 'border-sky-200/90 hover:border-sky-400',
      iconBox: 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25',
      valueColor: 'text-sky-950',
      glow: 'hover:shadow-sky-500/20 shadow-xs'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner & Live Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-pink-500/10 p-6 rounded-2xl border border-indigo-200/90 shadow-sm relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-indigo-300/30 to-purple-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">HR Analytics & Intelligence</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Real-time workforce performance, attendance trends, departmental distribution, and payroll liability.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-white/95 border border-indigo-200/70 hover:border-indigo-400 rounded-xl px-3 py-1.5 shadow-2xs transition-colors">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 bg-white/95 border border-indigo-200/70 hover:border-indigo-400 rounded-xl px-3 py-1.5 shadow-2xs transition-colors">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
            icon={RefreshCw}
            className={`rounded-xl shadow-2xs bg-white/90 border-slate-200 hover:bg-slate-50 ${refreshing ? 'animate-spin' : ''}`}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Link to="/employees/new">
            <Button
              size="sm"
              icon={Plus}
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-md shadow-indigo-500/25"
            >
              New Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <Button variant="secondary" size="sm" onClick={() => fetchDashboardData()}>
            Retry
          </Button>
        </div>
      )}

      {/* 6 Key Stat KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${kpi.border} ${kpi.cardBg} backdrop-blur-md shadow-xs hover:shadow-xl ${kpi.glow} hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-default`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.iconBox} flex items-center justify-center transition-transform group-hover:scale-110 duration-200 shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className={`mt-3 text-2xl sm:text-3xl font-black ${kpi.valueColor} tracking-tight`}>
                {loading ? <span className="text-slate-300 animate-pulse">--</span> : kpi.value}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium truncate">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* AI Workforce Intelligence & Insights Section */}
      <Card className="border-purple-200/80 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/30 shadow-md backdrop-blur-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">AI Workforce Intelligence & Insights</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 tracking-wide uppercase border border-purple-200">
                  Advisory Layer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Automated pattern recognition analyzing attendance trends, punctuality clusters, and leave backlogs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link to="/ai-assistant">
              <Button size="sm" icon={Sparkles} className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-purple-500/20">
                Policy Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Mandatory Policy & Ethics Disclaimer */}
        <div className="my-4 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center gap-2.5 text-amber-900 text-xs shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold">Ethical AI Notice:</span> Insights and recommendations are strictly advisory and provide operational visibility for managers. AI outputs must never be used to make automatic hiring, termination, or punitive disciplinary decisions.
          </p>
        </div>

        {/* Filter Toolbar & Severity Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAiFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                aiFilter === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                  : 'bg-white/90 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              All ({aiData?.insights?.length || 0})
            </button>
            <button
              onClick={() => setAiFilter('attendance')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                aiFilter === 'attendance'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'bg-white/90 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setAiFilter('leave')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                aiFilter === 'leave'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                  : 'bg-white/90 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              Leaves
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 bg-white/80 px-3 py-1 rounded-xl border border-slate-200/70 shadow-2xs">
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              High: {aiData?.counts?.high || 0}
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Medium: {aiData?.counts?.medium || 0}
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Optimal: {aiData?.counts?.low || 0}
            </span>
          </div>
        </div>

        {/* Insights Grid */}
        {aiLoading ? (
          <div className="py-12 text-center">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Synthesizing workforce intelligence patterns...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(aiData?.insights || [])
              .filter(i => aiFilter === 'all' || i.category === aiFilter)
              .map((item) => {
                const isHigh = item.severity === 'high';
                const isMedium = item.severity === 'medium';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isHigh
                        ? 'bg-gradient-to-br from-rose-50/90 via-white to-pink-50/50 border-rose-200 hover:border-rose-400'
                        : isMedium
                        ? 'bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/50 border-amber-200 hover:border-amber-400'
                        : 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-emerald-200 hover:border-emerald-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isMedium
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {item.severity} severity
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{item.insight}</p>

                      {/* Supporting Metric */}
                      <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2 shadow-2xs">
                        <BrainCircuit className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800">Supporting Metric: </span>
                          <span>{item.supportingMetric}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actionable Recommendation */}
                    <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-start gap-2 text-xs text-slate-800">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">Recommendation: </span>
                        <span>{item.recommendation}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Primary Analytics Charts Row: Attendance Trend & Department Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Attendance & Presence Trend */}
        <Card
          className="lg:col-span-2 border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-xs"
          title="Attendance & Punctuality Trend"
          subtitle={`Daily rate and turnout records for ${dateRange === '7d' ? 'past 7 days' : dateRange === '30d' ? 'past 30 days' : dateRange === '90d' ? 'past 90 days' : 'past year'}`}
          headerAction={
            <Link to="/attendance" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              Live Roster <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="h-72 w-full pt-2">
            {charts.attendanceTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No attendance logs found in this date window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[60, 100]} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                    formatter={(value, name) => [
                      name === 'presentRate' ? `${value}%` : value,
                      name === 'presentRate' ? 'Turnout Rate' : name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="presentRate"
                    name="Attendance Rate (%)"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#attendanceColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* 2. Department Workforce Distribution */}
        <Card
          className="border-teal-200/80 bg-gradient-to-b from-teal-50/40 via-white to-white shadow-xs"
          title="Department Distribution"
          subtitle="Workforce headcount across business units"
        >
          <div className="h-72 w-full flex flex-col justify-center items-center">
            {charts.departmentDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No departmental headcount recorded.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={charts.departmentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {charts.departmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                      formatter={(val, name, item) => [`${val} staff (${item.payload.percentage || 0}%)`, item.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-[11px] text-slate-600 w-full px-2 max-h-24 overflow-y-auto">
                  {charts.departmentDistribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate bg-slate-50/80 px-2 py-0.5 rounded-md border border-slate-100">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="truncate">{d.name}: <strong>{d.count}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Secondary Analytics Row: Leave Statistics & Monthly Payroll Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Leave Statistics by Type */}
        <Card
          className="border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-xs"
          title="Leave Requests by Category"
          subtitle="Real-time breakdown of Approved, Pending, and Rejected requests"
          headerAction={
            <Link to="/leaves" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Manage Leaves <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="h-64 w-full pt-2">
            {charts.leaveStatistics.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No leave requests filed yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.leaveStatistics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* 4. Payroll Payout Trends */}
        <Card
          className="border-violet-200/80 bg-gradient-to-b from-violet-50/40 via-white to-white shadow-xs"
          title="Payroll Overview & Expenditure Trend"
          subtitle="Monthly Gross Liability vs Net Disbursed Salaries"
          headerAction={
            <Link to="/payroll" className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
              All Payslips <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="h-64 w-full pt-2">
            {charts.payrollOverview.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No payroll cycles recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.payrollOverview} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="grossSalary" name="Gross Payout" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netSalary" name="Net Disbursed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* 5. Employee Growth Trend & Pending Leave Approvals Action Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Growth Over Time */}
        <Card
          className="lg:col-span-1 border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 via-white to-white shadow-xs"
          title="Headcount Growth"
          subtitle="New hires and talent onboarding timeline"
        >
          <div className="h-64 w-full pt-2">
            {charts.employeeGrowth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No hire history logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.employeeGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="New Joiners"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#growthColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Actionable Pending Leaves Requiring Review */}
        <Card
          className="lg:col-span-2 border-rose-200/80 bg-gradient-to-b from-rose-50/30 via-white to-white shadow-xs"
          title="Pending Leave Approvals"
          subtitle="Employee requests awaiting administrative authorization"
          headerAction={
            <Link to="/leaves">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-xs">
                View All Leaves
              </Button>
            </Link>
          }
        >
          <div className="overflow-x-auto">
            {recentPendingLeaves.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                All leave applications are currently reviewed and up to date.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Leave Type</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentPendingLeaves.map((lv) => (
                    <tr key={lv._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 block">{lv.employeeName}</span>
                        <span className="text-[11px] text-slate-400">{lv.department}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="warning">{lv.leaveType}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{lv.totalDays} day{lv.totalDays > 1 ? 's' : ''}</span>
                        <span className="text-[11px] text-slate-400 block">
                          {new Date(lv.startDate).toLocaleDateString()} &rarr; {new Date(lv.endDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate text-slate-600 italic">
                        "{lv.reason}"
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link to="/leaves">
                          <Button variant="secondary" size="sm">
                            Review
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
