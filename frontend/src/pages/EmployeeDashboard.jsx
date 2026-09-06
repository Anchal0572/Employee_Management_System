import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CalendarDays,
  CreditCard,
  Bell,
  Calendar,
  CheckCircle2,
  FileText,
  ArrowRight,
  TrendingUp,
  Plus,
  Play,
  Square,
  AlertCircle,
  Percent,
  UserCheck,
  UserX,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { useAuth } from '../context/AuthContext';
import { useEMSData } from '../context/EMSDataContext';
import { leaveService } from '../services/leaveService';
import { dashboardService } from '../services/dashboardService';
import { UPCOMING_HOLIDAYS } from '../data/mockData';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const {
    isClockedIn,
    clockInTime,
    toggleClock
  } = useEMSData();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leave modal state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Earned');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');

  const fetchPersonalDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getEmployeeDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError(err.message || 'Unable to retrieve personalized metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonalDashboard();
  }, [fetchPersonalDashboard]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setLeaveError('Please fill in all required fields.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setLeaveError('Start date cannot be after end date.');
      return;
    }
    try {
      setLeaveSubmitting(true);
      setLeaveError('');
      await leaveService.applyLeave({ leaveType, startDate, endDate, reason });
      setLeaveSuccess(`${leaveType} leave submitted! HR will review your request.`);
      setLeaveModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      // Refetch dashboard data to show updated balances
      fetchPersonalDashboard();
      setTimeout(() => setLeaveSuccess(''), 5000);
    } catch (err) {
      setLeaveError(err.message || 'Failed to submit leave application');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const profile = dashboardData?.profile || {
    name: user?.name || 'Valued Team Member',
    employeeId: user?.employeeId || 'EMP-001',
    department: user?.department || 'Engineering',
    designation: user?.designation || 'Staff Engineer',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  const personalStats = dashboardData?.personalStats || {
    attendanceRate: 96,
    daysPresent: 18,
    lateArrivals: 1,
    absences: 0,
    averageWorkingHours: 8.5
  };

  const leaveBalances = dashboardData?.leaveBalances || {
    Earned: { quota: 18, used: 4, remaining: 14, pending: 1 },
    Sick: { quota: 12, used: 2, remaining: 10, pending: 0 },
    Casual: { quota: 10, used: 3, remaining: 7, pending: 0 },
    Emergency: { quota: 5, used: 1, remaining: 4, pending: 0 }
  };

  const attendanceTrend = dashboardData?.attendanceTrend || [];
  const myRecentLeaves = dashboardData?.myRecentLeaves || [];
  const latestPayslip = dashboardData?.latestPayslip || null;

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {leaveSuccess && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{leaveSuccess}</span>
          </div>
          <button onClick={() => setLeaveSuccess('')} className="text-emerald-500 hover:text-emerald-700">
            ×
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchPersonalDashboard}>
            Retry
          </Button>
        </div>
      )}

      {/* Welcome Banner with Live Punch Clock Widget */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-14 h-14 rounded-full border-2 border-indigo-400 object-cover shadow-sm"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-400 font-medium">Personal Workspace</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-300">
                {profile.employeeId}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{profile.name}</h1>
            <p className="text-xs text-slate-400">
              {profile.designation} • <span className="text-indigo-400 font-medium">{profile.department}</span>
            </p>
          </div>
        </div>

        {/* Live Punch Clock Widget */}
        <div className="flex items-center gap-4 bg-slate-800/90 p-3 rounded-xl border border-slate-700/60 w-full md:w-auto justify-between md:justify-start">
          <div className="flex flex-col text-left md:text-right">
            <span className="text-[11px] uppercase font-semibold text-slate-400">Today's Shift</span>
            <span className="text-xs font-semibold text-slate-200">
              {isClockedIn ? `Punched in at ${clockInTime}` : 'Not clocked in yet'}
            </span>
          </div>
          <Button
            variant={isClockedIn ? 'danger' : 'primary'}
            size="md"
            onClick={toggleClock}
            className={isClockedIn ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
          >
            {isClockedIn ? (
              <>
                <Square className="w-4 h-4 mr-2" /> Clock Out
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Clock In
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Personal KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-3.5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance</span>
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{personalStats.attendanceRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Punctuality Score</p>
        </Card>

        <Card className="p-3.5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Days Present</span>
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{personalStats.daysPresent}</div>
          <p className="text-[11px] text-slate-500 mt-1">Shifts completed</p>
        </Card>

        <Card className="p-3.5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{personalStats.lateArrivals}</div>
          <p className="text-[11px] text-slate-500 mt-1">Grace period exceeded</p>
        </Card>

        <Card className="p-3.5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Hours/Day</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{personalStats.averageWorkingHours}h</div>
          <p className="text-[11px] text-slate-500 mt-1">Target: 8.0h shift</p>
        </Card>
      </div>

      {/* Leave Balance Quotas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Leave Balances</h2>
          <Button variant="outline" size="sm" icon={Plus} onClick={() => setLeaveModalOpen(true)}>
            Apply for Leave
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Earned / Annual Leave */}
          <Card className="p-4 border-l-4 border-l-indigo-600">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Earned Leave</span>
              <span className="text-indigo-600 font-semibold">{leaveBalances.Earned?.remaining ?? 14} left</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {leaveBalances.Earned?.remaining ?? 14}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {leaveBalances.Earned?.quota ?? 18} days</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((leaveBalances.Earned?.remaining ?? 14) / (leaveBalances.Earned?.quota || 18)) * 100)}%`
                }}
              />
            </div>
          </Card>

          {/* Sick Leave */}
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Sick Leave</span>
              <span className="text-amber-600 font-semibold">{leaveBalances.Sick?.remaining ?? 10} left</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {leaveBalances.Sick?.remaining ?? 10}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {leaveBalances.Sick?.quota ?? 12} days</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((leaveBalances.Sick?.remaining ?? 10) / (leaveBalances.Sick?.quota || 12)) * 100)}%`
                }}
              />
            </div>
          </Card>

          {/* Casual Leave */}
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Casual Leave</span>
              <span className="text-emerald-600 font-semibold">{leaveBalances.Casual?.remaining ?? 7} left</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {leaveBalances.Casual?.remaining ?? 7}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {leaveBalances.Casual?.quota ?? 10} days</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((leaveBalances.Casual?.remaining ?? 7) / (leaveBalances.Casual?.quota || 10)) * 100)}%`
                }}
              />
            </div>
          </Card>

          {/* Emergency Leave */}
          <Card className="p-4 border-l-4 border-l-sky-500">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Emergency Leave</span>
              <span className="text-sky-600 font-semibold">{leaveBalances.Emergency?.remaining ?? 4} left</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {leaveBalances.Emergency?.remaining ?? 4}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {leaveBalances.Emergency?.quota ?? 5} days</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((leaveBalances.Emergency?.remaining ?? 4) / (leaveBalances.Emergency?.quota || 5)) * 100)}%`
                }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Main Grid: Attendance Trend Chart & Latest Payslip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Attendance Trend with Recharts */}
        <Card
          className="lg:col-span-2"
          title="Personal Timesheet & Working Hours"
          subtitle="Hours logged per shift over recent working days"
          headerAction={
            <Link to="/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Full Timesheet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="h-64 w-full pt-2">
            {attendanceTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No attendance entries recorded for current pay period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="personalAttColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 12]} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [`${val} hrs`, 'Working Hours']}
                    labelFormatter={(label, items) => {
                      const item = items[0]?.payload;
                      return item ? `${item.date} (${item.day}) • ${item.status}` : label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hoursWorked"
                    name="Working Hours"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#personalAttColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Table Summary Below Chart */}
          <div className="overflow-x-auto mt-4 pt-3 border-t border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-100">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Check-In</th>
                  <th className="pb-2">Check-Out</th>
                  <th className="pb-2">Hours</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendanceTrend.slice(-4).map((rec, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 font-medium text-slate-900">{rec.date} ({rec.day})</td>
                    <td className="py-2">{rec.checkIn || '--'}</td>
                    <td className="py-2">{rec.checkOut || '--'}</td>
                    <td className="py-2">{rec.hoursWorked} hrs</td>
                    <td className="py-2 text-right">
                      <Badge variant={rec.status === 'Present' ? 'success' : rec.status === 'Late' ? 'warning' : 'neutral'} dot>
                        {rec.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Latest Payslip Summary Card */}
        <Card
          title="Latest Payslip"
          subtitle={latestPayslip?.salaryMonth || 'August 2026'}
          headerAction={
            <Badge variant="success">Paid</Badge>
          }
        >
          {latestPayslip ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500">Net Take-Home Pay</span>
                <div className="text-3xl font-bold text-slate-900 mt-1">
                  ${Number(latestPayslip.netSalary || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {latestPayslip.paymentDate ? `Disbursed on ${new Date(latestPayslip.paymentDate).toLocaleDateString()}` : 'Direct Deposit Scheduled'}
                </p>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Gross Earnings:</span>
                  <span className="font-semibold text-slate-800">${Number(latestPayslip.grossSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Total Deductions:</span>
                  <span className="font-semibold text-rose-600">-${Number(latestPayslip.totalDeductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Bank Account:</span>
                  <span className="font-medium text-slate-700">{latestPayslip.bankAccount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link to={latestPayslip.id ? `/payroll/${latestPayslip.id}` : '/payroll'} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full" icon={FileText}>
                    View Details
                  </Button>
                </Link>
                {latestPayslip.id && (
                  <Link to={`/payroll/${latestPayslip.id}/print`} className="flex-1" target="_blank">
                    <Button variant="primary" size="sm" className="w-full">
                      Print Slip
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No payslip has been generated for your account yet.
            </div>
          )}
        </Card>
      </div>

      {/* Two Columns: My Leave Requests & Upcoming Public Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending & Recent Leave Requests */}
        <Card
          title="My Leave Requests"
          subtitle="Track approval status of your submitted applications"
          headerAction={
            <Button variant="outline" size="sm" icon={Plus} onClick={() => setLeaveModalOpen(true)}>
              New Request
            </Button>
          }
        >
          <div className="divide-y divide-slate-100">
            {myRecentLeaves.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You have no active leave requests.
              </div>
            ) : (
              myRecentLeaves.map((lv) => (
                <div key={lv._id || lv.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{lv.leaveType}</span>
                      <span className="text-[11px] text-slate-500">({lv.totalDays} day{lv.totalDays > 1 ? 's' : ''})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {new Date(lv.startDate).toLocaleDateString()} &rarr; {new Date(lv.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">"{lv.reason}"</p>
                  </div>
                  <Badge
                    variant={
                      lv.status === 'Approved' || lv.status === 'approved'
                        ? 'success'
                        : lv.status === 'Rejected' || lv.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    dot
                  >
                    {lv.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Public Holidays */}
        <Card
          title="Upcoming Company Holidays"
          subtitle="Official company calendar & paid public observances"
        >
          <div className="divide-y divide-slate-100">
            {UPCOMING_HOLIDAYS.map((holiday, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900">{holiday.name}</span>
                    <p className="text-[11px] text-slate-500">{holiday.date}</p>
                  </div>
                </div>
                <Badge variant="neutral">{holiday.daysAway}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => { setLeaveModalOpen(false); setLeaveError(''); }}
        title="Apply for Leave"
        subtitle="Submit a formal leave request for HR approval"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          {leaveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {leaveError}
            </div>
          )}

          <Select
            label="Leave Type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            options={[
              { value: 'Earned', label: 'Earned Leave (Annual Vacation)' },
              { value: 'Sick', label: 'Sick Leave (Medical/Health)' },
              { value: 'Casual', label: 'Casual Leave (Personal errands)' },
              { value: 'Emergency', label: 'Emergency Leave' },
              { value: 'Other', label: 'Other Leave of Absence' }
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Reason / Note"
            placeholder="Brief reason for your leave request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { setLeaveModalOpen(false); setLeaveError(''); }}
              disabled={leaveSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={leaveSubmitting}
              loading={leaveSubmitting}
            >
              {leaveSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
