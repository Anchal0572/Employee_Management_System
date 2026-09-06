import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Plus,
  ArrowUpDown,
  Download,
  Filter,
  UserCheck,
  UserX,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Trash2,
  Edit3,
  X
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { useEMSData } from '../context/EMSDataContext';

export const Attendance = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { employees } = useEMSData();

  // Active view: 'register' (table) vs 'calendar' (monthly visual grid)
  const [activeView, setActiveView] = useState('register');

  // Real-time local digital clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's punch state
  const [todayState, setTodayState] = useState({
    isClockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    status: 'Not Checked In',
    workingHours: 0
  });
  const [isPunching, setIsPunching] = useState(false);

  // Workforce KPI metrics
  const [metrics, setMetrics] = useState({
    attendancePercentage: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    averageWorkingHours: 8.2,
    totalWorkforce: 6
  });

  // Table & Filters state
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  // Manual Entry Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeId: 'EMP-001',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '17:30',
    status: 'Present',
    remarks: 'Manual attendance log by Administrator'
  });

  // Fetch today status
  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await attendanceService.getTodayStatus();
      setTodayState({
        isClockedIn: res.isClockedIn,
        clockInTime: res.clockInTime,
        clockOutTime: res.clockOutTime,
        status: res.status,
        workingHours: res.workingHours
      });
    } catch (err) {
      console.warn('Today status fetch error:', err.message);
    }
  }, []);

  // Fetch KPI statistics
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await attendanceService.getAttendanceMetrics({
        department: selectedDept,
        date: selectedDate
      });
      setMetrics(data);
    } catch (err) {
      console.warn('Attendance metrics fetch error:', err.message);
    }
  }, [selectedDept, selectedDate]);

  // Fetch attendance register records
  const fetchAttendanceList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        const res = await attendanceService.getAdminAttendance({
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          department: selectedDept,
          status: selectedStatus,
          date: selectedDate
        });
        setAttendanceRecords(res.records);
        setPagination(res.pagination);
      } else {
        const res = await attendanceService.getMyHistory({
          page: currentPage,
          limit: pageSize,
          status: selectedStatus
        });
        setAttendanceRecords(res.records);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching attendance list:', err);
      setError(err.message || 'Unable to retrieve attendance records');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentPage, pageSize, searchTerm, selectedDept, selectedStatus, selectedDate]);

  // Initial and reactive load
  useEffect(() => {
    fetchTodayStatus();
    fetchMetrics();
  }, [fetchTodayStatus, fetchMetrics]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendanceList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAttendanceList]);

  // Live elapsed work duration timer calculation
  const elapsedDuration = useMemo(() => {
    if (!todayState.isClockedIn || !todayState.clockInTime) {
      return null;
    }
    const diffMs = Math.max(0, currentTime - new Date(todayState.clockInTime));
    const totalSec = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }, [todayState.isClockedIn, todayState.clockInTime, currentTime]);

  // Check-In Action
  const handleCheckIn = async () => {
    try {
      setIsPunching(true);
      const res = await attendanceService.checkIn({
        location: 'Office HQ - Main Tower',
        remarks: 'Biometric web punch'
      });
      setToastMessage('Clock-in recorded successfully! Have a productive day.');
      await fetchTodayStatus();
      await fetchMetrics();
      await fetchAttendanceList();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setIsPunching(false);
    }
  };

  // Check-Out Action
  const handleCheckOut = async () => {
    try {
      setIsPunching(true);
      const res = await attendanceService.checkOut({
        remarks: 'Completed day shift'
      });
      setToastMessage(`Clock-out recorded! Shift duration: ${res.workingHours || 0} hours.`);
      await fetchTodayStatus();
      await fetchMetrics();
      await fetchAttendanceList();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Check-out failed');
    } finally {
      setIsPunching(false);
    }
  };

  // Handle Manual Attendance Submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      setManualSubmitting(true);
      const emp = employees.find(e => e.id === manualForm.employeeId || e.employeeId === manualForm.employeeId);

      const checkInDate = manualForm.checkIn ? new Date(`${manualForm.date}T${manualForm.checkIn}:00.000Z`) : null;
      const checkOutDate = manualForm.checkOut ? new Date(`${manualForm.date}T${manualForm.checkOut}:00.000Z`) : null;

      await attendanceService.createManualAttendance({
        employeeId: manualForm.employeeId,
        employeeName: emp?.name || 'Staff Member',
        department: emp?.department || 'Engineering',
        date: manualForm.date,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: manualForm.status,
        remarks: manualForm.remarks
      });

      setToastMessage('Manual attendance entry created successfully!');
      setManualModalOpen(false);
      await fetchMetrics();
      await fetchAttendanceList();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to create manual attendance');
    } finally {
      setManualSubmitting(false);
    }
  };

  // Delete Attendance Record (Admin)
  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceService.deleteAttendance(id);
        setToastMessage('Attendance record removed');
        await fetchMetrics();
        await fetchAttendanceList();
        setTimeout(() => setToastMessage(''), 4000);
      } catch (err) {
        alert(err.message || 'Delete failed');
      }
    }
  };

  // Status badge variant helper
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'half day':
        return 'info';
      case 'absent':
        return 'danger';
      case 'leave':
        return 'neutral';
      case 'holiday':
        return 'info';
      default:
        return 'neutral';
    }
  };

  // Calendar Day generator for current month
  const calendarDays = useMemo(() => {
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayMatches = attendanceRecords.filter(r => {
        const rDate = new Date(r.date).toISOString().split('T')[0];
        return rDate === dateStr;
      });
      days.push({
        dayNumber: day,
        dateStr,
        records: dayMatches
      });
    }
    return days;
  }, [currentTime, attendanceRecords]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header with Live Punch Terminal & Clock */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 rounded-2xl border border-emerald-200/90 shadow-sm relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-emerald-300/30 to-teal-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isAdmin ? 'Enterprise Attendance & Timesheet Hub' : 'My Attendance & Work Hours'}
            </h1>
            <Badge variant={todayState.isClockedIn ? 'success' : 'neutral'} dot>
              {todayState.isClockedIn ? 'Active On Shift' : 'Clocked Out'}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {isAdmin
              ? 'Real-time biometric punch terminal, punctuality logs, and workforce attendance compliance.'
              : 'Record daily shifts, verify check-in timings, and track overtime & attendance balance.'}
          </p>
        </div>

        {/* Digital Clock & Live Punch Controls */}
        <div className="flex flex-wrap items-center gap-3.5 relative z-10">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/95 rounded-xl border border-emerald-200/80 shadow-2xs">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-mono text-base font-black text-slate-900 leading-none">
                {currentTime.toLocaleTimeString('en-US', { hour12: true })}
              </div>
              <div className="text-[10px] text-emerald-800 font-bold uppercase mt-0.5 tracking-wider">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Punch Button */}
          {todayState.isClockedIn ? (
            <Button
              size="md"
              disabled={isPunching}
              onClick={handleCheckOut}
              icon={isPunching ? Loader2 : Square}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold shadow-lg shadow-rose-500/25 ring-2 ring-rose-400/20 rounded-xl"
            >
              {isPunching ? 'Clocking Out...' : `Clock Out (${elapsedDuration || 'Active'})`}
            </Button>
          ) : (
            <Button
              size="md"
              disabled={isPunching || (todayState.clockOutTime !== null)}
              onClick={handleCheckIn}
              icon={isPunching ? Loader2 : Play}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/20 rounded-xl"
            >
              {isPunching ? 'Clocking In...' : todayState.clockOutTime ? 'Shift Completed Today' : 'Clock In Now'}
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="secondary"
              size="md"
              icon={Plus}
              onClick={() => setManualModalOpen(true)}
              className="rounded-xl bg-white/95 border-slate-200 font-bold hover:bg-slate-50"
            >
              Manual Log
            </Button>
          )}
        </div>
      </div>

      {/* Real-time KPI Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 border border-indigo-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Attendance Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1">{metrics.attendancePercentage}%</div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Real-time turnover
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 border border-emerald-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Present Today</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">{metrics.presentCount}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ On-time check-ins</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100/50 border border-amber-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Late Arrivals</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">{metrics.lateCount}</div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Past 09:30 AM grace</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-rose-100/50 border border-rose-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Absent / Unreported</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-950 mt-1">{metrics.absentCount}</div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">Out of {metrics.totalWorkforce} staff</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-cyan-100/50 border border-sky-200/90 shadow-xs hover:-translate-y-0.5 transition-all col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Avg Working Hours</div>
          <div className="text-2xl sm:text-3xl font-black text-sky-950 mt-1">{metrics.averageWorkingHours} <span className="text-xs font-semibold text-sky-600">hrs/day</span></div>
          <p className="text-[11px] text-sky-600 font-semibold mt-1">Standard 8.0 baseline</p>
        </div>
      </div>

      {/* Main Content Card with Dual View Toggle */}
      <Card className="border-emerald-200/80 bg-white/95 shadow-xs">
        {/* Controls & Filter Header */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {/* View Switcher Buttons */}
            <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveView('register')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'register'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Timesheet Register
              </button>
              <button
                type="button"
                onClick={() => setActiveView('calendar')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'calendar'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calendar Heatmap
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search (Admin) */}
            {isAdmin && (
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {/* Department Filter (Admin) */}
            {isAdmin && (
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
              <option value="Absent">Absent</option>
              <option value="Holiday">Holiday</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white"
            />

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-xs text-rose-500 hover:text-rose-700 px-1 font-medium"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* View 1: Timesheet Register Table */}
        {activeView === 'register' && (
          <div className="overflow-x-auto min-h-[340px]">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Fetching verified attendance timesheets...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-rose-600 mb-1">Failed to load attendance logs</p>
                <p className="text-xs text-slate-500 mb-4">{error}</p>
                <Button size="sm" variant="secondary" onClick={fetchAttendanceList}>
                  Retry
                </Button>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No attendance records found</p>
                <p className="text-slate-400 mt-0.5">Try clearing filters or checking in for today.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Check-In</th>
                    <th className="py-3 px-3">Check-Out</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Remarks</th>
                    {isAdmin && <th className="py-3 px-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendanceRecords.map((rec) => {
                    const id = rec._id || rec.id;
                    const dateFormatted = rec.date ? new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                    const checkInFormatted = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
                    const checkOutFormatted = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (rec.checkIn ? 'In Progress' : '—');

                    return (
                      <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Employee Name & ID */}
                        <td className="py-3 px-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold">{rec.employeeName || 'Staff Member'}</p>
                              <span className="text-[11px] text-indigo-600 font-mono font-normal">
                                {rec.employeeId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {rec.department || 'General'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{dateFormatted}</td>

                        {/* Check-In */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-800">{checkInFormatted}</td>

                        {/* Check-Out */}
                        <td className="py-3 px-3 font-mono text-slate-800">{checkOutFormatted}</td>

                        {/* Duration */}
                        <td className="py-3 px-3">
                          {rec.workingHours > 0 ? (
                            <span className="font-semibold text-slate-900">{rec.workingHours} hrs</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <Badge variant={getStatusVariant(rec.status)} dot size="sm">
                            {rec.status}
                          </Badge>
                        </td>

                        {/* Remarks */}
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                          {rec.remarks || 'Standard automated log'}
                        </td>

                        {/* Admin Action */}
                        {isAdmin && (
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing <strong className="text-slate-800">{attendanceRecords.length}</strong> of{' '}
                <strong className="text-slate-800">{pagination.total}</strong> timesheet entries
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                <span className="px-2 font-medium text-slate-700">
                  Page {pagination.page || currentPage} of {pagination.totalPages || 1}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= (pagination.totalPages || 1) || loading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Monthly Visual Attendance Calendar */}
        {activeView === 'calendar' && (
          <div className="p-2">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
              <div className="font-semibold text-slate-900">
                {currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Late
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> Half Day
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-slate-400 py-1 uppercase">
                  {d}
                </div>
              ))}

              {calendarDays.map((cal) => (
                <div
                  key={cal.dateStr}
                  onClick={() => {
                    setSelectedDate(cal.dateStr);
                    setActiveView('register');
                  }}
                  className={`min-h-[75px] p-2 rounded-xl border text-left cursor-pointer transition-all hover:border-indigo-400 hover:shadow-xs ${
                    cal.records.length > 0
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-700">{cal.dayNumber}</span>
                  <div className="mt-1 space-y-1">
                    {cal.records.slice(0, 2).map((r, i) => (
                      <div
                        key={i}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                          r.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'Half Day'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                        title={`${r.employeeName || r.employeeId}: ${r.status}`}
                      >
                        {r.employeeName?.split(' ')[0] || r.employeeId}: {r.status}
                      </div>
                    ))}
                    {cal.records.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-semibold">
                        +{cal.records.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Admin Manual Entry Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Manual Attendance Entry"
        subtitle="Record past shift exceptions or biometric adjustments."
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={manualForm.employeeId}
            onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
            options={employees.map((emp) => ({
              value: emp.id || emp.employeeId,
              label: `${emp.name} (${emp.id || emp.employeeId} • ${emp.department})`
            }))}
          />

          <Input
            label="Attendance Date"
            type="date"
            required
            value={manualForm.date}
            onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check-In Time"
              type="time"
              value={manualForm.checkIn}
              onChange={(e) => setManualForm({ ...manualForm, checkIn: e.target.value })}
            />
            <Input
              label="Check-Out Time"
              type="time"
              value={manualForm.checkOut}
              onChange={(e) => setManualForm({ ...manualForm, checkOut: e.target.value })}
            />
          </div>

          <Select
            label="Status"
            value={manualForm.status}
            onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
            options={[
              { value: 'Present', label: 'Present' },
              { value: 'Late', label: 'Late' },
              { value: 'Half Day', label: 'Half Day' },
              { value: 'Leave', label: 'Leave' },
              { value: 'Absent', label: 'Absent' },
              { value: 'Holiday', label: 'Holiday' }
            ]}
          />

          <Input
            label="Adjustment Remarks"
            placeholder="Reason for manual entry..."
            value={manualForm.remarks}
            onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={manualSubmitting}
              onClick={() => setManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={manualSubmitting}
              icon={manualSubmitting ? Loader2 : CheckCircle2}
            >
              {manualSubmitting ? 'Saving...' : 'Confirm Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
