import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Check,
  X,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Building2,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Info,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { leaveService } from '../services/leaveService';
import { useEMSData } from '../context/EMSDataContext';

export const LeaveManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { refreshEmployees } = useEMSData();

  // Leaves & Balances state
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Balance Quotas state
  const [leaveBalances, setLeaveBalances] = useState({
    balances: {
      Earned: { total: 18, used: 0, pending: 0, remaining: 18 },
      Sick: { total: 12, used: 0, pending: 0, remaining: 12 },
      Casual: { total: 10, used: 0, pending: 0, remaining: 10 },
      Emergency: { total: 5, used: 0, pending: 0, remaining: 5 },
      Other: { total: 5, used: 0, pending: 0, remaining: 5 }
    },
    totalRemaining: 50,
    totalUsed: 0
  });

  // Admin Summary metrics
  const [adminSummary, setAdminSummary] = useState({
    totalRequests: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
    onLeaveToday: 0
  });

  // Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Earned',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Review Modal state (Admin)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [adminComment, setAdminComment] = useState('');

  // Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);

  // Auto-calculated days in application modal
  const calculatedDays = useMemo(() => {
    if (!applyForm.startDate || !applyForm.endDate) return 0;
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
    const diff = end - start;
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  }, [applyForm.startDate, applyForm.endDate]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    try {
      const data = await leaveService.getMyLeaveBalance();
      setLeaveBalances(data);
    } catch (err) {
      console.warn('Leave balance fetch error:', err.message);
    }
  }, []);

  // Fetch admin summary
  const fetchSummary = useCallback(async () => {
    try {
      const data = await leaveService.getLeaveSummary({ department: selectedDept });
      setAdminSummary(data);
    } catch (err) {
      console.warn('Leave summary fetch error:', err.message);
    }
  }, [selectedDept]);

  // Fetch leaves list
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        const res = await leaveService.getAdminLeaves({
          page: currentPage,
          limit: pageSize,
          status: selectedStatus,
          leaveType: selectedType,
          department: selectedDept,
          search: searchTerm
        });
        setLeaves(res.leaves);
        setPagination(res.pagination);
      } else {
        const res = await leaveService.getMyLeaves({
          page: currentPage,
          limit: pageSize,
          status: selectedStatus,
          leaveType: selectedType
        });
        setLeaves(res.leaves);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
      setError(err.message || 'Unable to retrieve leave records');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentPage, pageSize, selectedStatus, selectedType, selectedDept, searchTerm]);

  // Trigger loads
  useEffect(() => {
    fetchBalances();
    if (isAdmin) fetchSummary();
  }, [fetchBalances, fetchSummary, isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaves();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLeaves]);

  // Handle Leave Application Submit
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason) {
      setApplyError('Please fill out all mandatory fields.');
      return;
    }

    if (new Date(applyForm.startDate) > new Date(applyForm.endDate)) {
      setApplyError('Start date cannot be after end date.');
      return;
    }

    try {
      setApplySubmitting(true);
      setApplyError('');

      await leaveService.applyLeave({
        leaveType: applyForm.leaveType,
        startDate: applyForm.startDate,
        endDate: applyForm.endDate,
        reason: applyForm.reason
      });

      setToastMessage('Leave application submitted successfully! Notification dispatched to HR.');
      setApplyModalOpen(false);
      setApplyForm({ leaveType: 'Earned', startDate: '', endDate: '', reason: '' });

      await fetchBalances();
      if (isAdmin) await fetchSummary();
      await fetchLeaves();

      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit leave application');
    } finally {
      setApplySubmitting(false);
    }
  };

  // Open Review Dialog for Admin
  const openReviewModal = (leave, action) => {
    setSelectedLeaveForReview(leave);
    setReviewAction(action);
    setAdminComment(action === 'Approved' ? 'Approved. Enjoy your time off.' : 'Unable to approve due to team schedule.');
    setReviewModalOpen(true);
  };

  // Submit Review Action (Admin)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeaveForReview) return;

    try {
      setReviewSubmitting(true);
      const leaveId = selectedLeaveForReview._id || selectedLeaveForReview.id;

      await leaveService.reviewLeave(leaveId, {
        status: reviewAction,
        adminComment
      });

      setToastMessage(`Leave request for ${selectedLeaveForReview.employeeName} was ${reviewAction.toLowerCase()}.`);
      setReviewModalOpen(false);
      setSelectedLeaveForReview(null);

      await fetchBalances();
      if (isAdmin) await fetchSummary();
      await fetchLeaves();

      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to review leave request');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Cancel Leave (Employee)
  const handleCancelLeave = async (leave) => {
    const leaveId = leave._id || leave.id;
    if (window.confirm(`Are you sure you want to cancel your ${leave.leaveType} leave request?`)) {
      try {
        await leaveService.cancelLeave(leaveId);
        setToastMessage('Leave request successfully cancelled.');
        await fetchBalances();
        if (isAdmin) await fetchSummary();
        await fetchLeaves();
        setTimeout(() => setToastMessage(''), 4000);
      } catch (err) {
        alert(err.message || 'Failed to cancel leave request');
      }
    }
  };

  // Status badge styling
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  // Pending leaves awaiting admin review
  const pendingRequests = useMemo(() => {
    return leaves.filter((l) => l.status === 'Pending');
  }, [leaves]);

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 rounded-2xl border border-amber-200/90 shadow-sm relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-amber-300/30 to-rose-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave & Absence Operations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
              Time-off Hub
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Track annual vacation quotas, submit time-off requests, and manage administrative approval lifecycles.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button
            size="md"
            icon={Plus}
            onClick={() => setApplyModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20 rounded-xl"
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Admin KPI Summary / Workforce Quotas */}
      {isAdmin ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100/60 border border-amber-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Requests</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">{adminSummary.pendingCount}</div>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">Requires HR Decision</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved Leaves</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">{adminSummary.approvedCount}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Reconciled in timesheets</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100/60 border border-indigo-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">On Leave Today</div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1">{adminSummary.onLeaveToday}</div>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Active out-of-office</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-rose-100/60 border border-rose-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Rejected Requests</div>
            <div className="text-2xl sm:text-3xl font-black text-rose-950 mt-1">{adminSummary.rejectedCount}</div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">Coverage / policy issues</p>
          </div>
        </div>
      ) : (
        /* Employee Personal Leave Balance Cards */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Object.entries(leaveBalances.balances).map(([type, quota]) => {
            const percent = quota.total > 0 ? Math.round((quota.remaining / quota.total) * 100) : 0;
            const cardBg = 
              type === 'Sick' ? 'from-emerald-50 via-white to-emerald-100/50 border-emerald-200/90' :
              type === 'Casual' ? 'from-amber-50 via-white to-amber-100/50 border-amber-200/90' :
              type === 'Emergency' ? 'from-rose-50 via-white to-rose-100/50 border-rose-200/90' :
              type === 'Other' ? 'from-violet-50 via-white to-purple-100/50 border-violet-200/90' :
              'from-indigo-50 via-white to-indigo-100/50 border-indigo-200/90';

            const barColor = 
              type === 'Sick' ? 'bg-emerald-500' :
              type === 'Casual' ? 'bg-amber-500' :
              type === 'Emergency' ? 'bg-rose-500' :
              type === 'Other' ? 'bg-violet-500' :
              'bg-indigo-600';

            return (
              <div key={type} className={`p-4 rounded-2xl bg-gradient-to-br ${cardBg} border shadow-xs hover:-translate-y-0.5 transition-all`}>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{type} Leave</span>
                  <span className="text-indigo-600 font-black">{quota.remaining} left</span>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {quota.remaining} <span className="text-xs text-slate-400 font-semibold">/ {quota.total} d</span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${barColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-medium">
                  <span>{quota.used} used</span>
                  {quota.pending > 0 && <span className="text-amber-700 font-bold">({quota.pending} pending)</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Action Box: Pending Approval Requests */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-950">
                Action Required: {pendingRequests.length} Pending Leave Request{pendingRequests.length > 1 ? 's' : ''}
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
              Awaiting Administrative Decision
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.map((req) => {
              const startStr = req.startDate ? new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
              const endStr = req.endDate ? new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              return (
                <div key={req._id || req.id} className="p-3.5 bg-white rounded-xl border border-amber-200/90 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{req.employeeName}</span>
                      <Badge variant="warning" size="sm" dot>
                        {req.leaveType} ({req.totalDays}d)
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {startStr} – {endStr}
                    </p>
                    <p className="text-xs text-slate-700 italic line-clamp-2">"{req.reason}"</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      onClick={() => openReviewModal(req, 'Rejected')}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => openReviewModal(req, 'Approved')}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Leave Requests Table */}
      <Card>
        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or reason..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Leave Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white"
            >
              <option value="All">All Leave Types</option>
              <option value="Earned">Earned</option>
              <option value="Sick">Sick</option>
              <option value="Casual">Casual</option>
              <option value="Emergency">Emergency</option>
              <option value="Other">Other</option>
            </select>

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
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto min-h-[340px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Fetching verified leave requests...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-sm font-semibold text-rose-600 mb-1">Failed to load leave requests</p>
              <p className="text-xs text-slate-500 mb-4">{error}</p>
              <Button size="sm" variant="secondary" onClick={fetchLeaves}>
                Retry
              </Button>
            </div>
          ) : leaves.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No leave records found</p>
              <p className="text-slate-400 mt-0.5">Submit an application using the button above.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Leave Type</th>
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Applied On</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leaves.map((leave) => {
                  const id = leave._id || leave.id;
                  const startStr = leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                  const endStr = leave.endDate ? new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                  const appliedStr = leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

                  const isOwnLeave =
                    leave.employeeId === user.employeeId ||
                    leave.employeeName === user.name ||
                    (leave.employee && user.id && leave.employee.toString() === user.id.toString());
                  const isEligibleForCancel = leave.status === 'Pending' && (isOwnLeave || isAdmin);

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{leave.employeeName || 'Staff Member'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          {leave.department || 'General'} • {leave.employeeId}
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {leave.leaveType}
                      </td>

                      {/* Period */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {startStr} – {endStr}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900">{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
                      </td>

                      {/* Applied On */}
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{appliedStr}</td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge variant={getStatusBadgeVariant(leave.status)} dot size="sm">
                          {leave.status}
                        </Badge>
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600" title={leave.reason}>
                        {leave.reason}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeaveDetails(leave);
                              setDetailsModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View full details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Admin Review Action */}
                          {isAdmin && leave.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openReviewModal(leave, 'Approved')}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Approve leave"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openReviewModal(leave, 'Rejected')}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Reject leave"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Cancel Action */}
                          {isEligibleForCancel && (
                            <button
                              type="button"
                              onClick={() => handleCancelLeave(leave)}
                              className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing <strong className="text-slate-800">{leaves.length}</strong> of{' '}
              <strong className="text-slate-800">{pagination.total}</strong> leave records
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
      </Card>

      {/* Leave Application Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Leave of Absence"
        subtitle="Submit time-off dates for administrative approval."
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {applyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          <Select
            label="Leave Category"
            value={applyForm.leaveType}
            onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
            options={[
              { value: 'Earned', label: 'Earned Leave (Annual Vacation)' },
              { value: 'Sick', label: 'Sick Leave (Medical/Health)' },
              { value: 'Casual', label: 'Casual Leave (Personal errands)' },
              { value: 'Emergency', label: 'Emergency Leave' },
              { value: 'Other', label: 'Other Leave of Absence' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={applyForm.startDate}
              onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={applyForm.endDate}
              onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
            />
          </div>

          {calculatedDays > 0 && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between text-xs text-indigo-900">
              <span className="font-medium">Total Duration:</span>
              <span className="font-bold">{calculatedDays} day{calculatedDays > 1 ? 's' : ''}</span>
            </div>
          )}

          <Textarea
            label="Reason for Request"
            placeholder="Please detail your reason for taking leave..."
            required
            rows={3}
            value={applyForm.reason}
            onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={applySubmitting}
              onClick={() => setApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={applySubmitting}
              icon={applySubmitting ? Loader2 : CheckCircle2}
            >
              {applySubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`${reviewAction} Leave Request`}
        subtitle={`Reviewing application for ${selectedLeaveForReview?.employeeName || 'Staff Member'}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Applicant:</span>
              <span className="font-bold text-slate-900">{selectedLeaveForReview?.employeeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="font-semibold text-slate-800">{selectedLeaveForReview?.leaveType} ({selectedLeaveForReview?.totalDays} days)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Reason:</span>
              <span className="text-slate-700 italic">"{selectedLeaveForReview?.reason}"</span>
            </div>
          </div>

          <Select
            label="Decision"
            value={reviewAction}
            onChange={(e) => setReviewAction(e.target.value)}
            options={[
              { value: 'Approved', label: 'Approve Request' },
              { value: 'Rejected', label: 'Reject Request' }
            ]}
          />

          <Textarea
            label="Administrator Note / Feedback"
            placeholder="Provide context or instructions for the employee..."
            rows={3}
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={reviewSubmitting}
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'Approved' ? 'primary' : 'danger'}
              size="sm"
              disabled={reviewSubmitting}
              icon={reviewSubmitting ? Loader2 : CheckCircle2}
            >
              {reviewSubmitting ? 'Processing...' : `Confirm ${reviewAction}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      {detailsModalOpen && selectedLeaveDetails && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Leave Application Details"
          subtitle={`Reference ID: ${selectedLeaveDetails._id || selectedLeaveDetails.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Employee Name</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedLeaveDetails.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Department</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{selectedLeaveDetails.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Leave Category</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{selectedLeaveDetails.leaveType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Duration</span>
                <span className="font-bold text-indigo-600 mt-0.5 block">{selectedLeaveDetails.totalDays} day(s)</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Requested Timeline</span>
              <span className="font-mono text-slate-800 mt-0.5 block">
                {new Date(selectedLeaveDetails.startDate).toLocaleDateString()} to {new Date(selectedLeaveDetails.endDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Reason for Absence</span>
              <p className="p-3 bg-slate-50 rounded-lg text-slate-700 italic mt-1 border border-slate-100">
                "{selectedLeaveDetails.reason}"
              </p>
            </div>

            {selectedLeaveDetails.adminComment && (
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <span className="text-indigo-900 font-bold block flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Reviewer Notes ({selectedLeaveDetails.reviewerName || 'HR Admin'})
                </span>
                <p className="text-indigo-800 text-[11px] mt-1">
                  "{selectedLeaveDetails.adminComment}"
                </p>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="secondary" onClick={() => setDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
