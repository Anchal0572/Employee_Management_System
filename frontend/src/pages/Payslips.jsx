import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, DollarSign, Calendar, Search, Eye, Printer, Plus,
  CheckCircle2, Clock, AlertTriangle, XCircle, BarChart3, RefreshCw,
  ChevronDown, Trash2, TrendingUp, Building2, Filter, X, Users
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { payslipService } from '../services/payslipService';
import { employeeService } from '../services/employeeService';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) => `$${(n || 0).toLocaleString()}`;
const fmtMonth = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

const STATUS_CONFIG = {
  Draft:      { variant: 'neutral',  icon: Clock,        label: 'Draft' },
  Processing: { variant: 'warning',  icon: AlertTriangle, label: 'Processing' },
  Paid:       { variant: 'success',  icon: CheckCircle2, label: 'Paid' },
  Failed:     { variant: 'danger',   icon: XCircle,      label: 'Failed' },
  Cancelled:  { variant: 'neutral',  icon: XCircle,      label: 'Cancelled' }
};

const PAYMENT_STATUSES = ['Draft', 'Processing', 'Paid', 'Failed', 'Cancelled'];

// Generate last 12 months in YYYY-MM format
const getLast12Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate Payslip Modal
// ─────────────────────────────────────────────────────────────────────────────

const GenerateModal = ({ onClose, onGenerated, employees }) => {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [form, setForm] = useState({
    employeeId: '',
    salaryMonth: defaultMonth,
    basicSalary: '',
    bonus: '0',
    notes: ''
  });
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill salary when employee selected
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    set('employeeId', empId);

    const emp = employees.find(em => em.employeeId === empId || em.id === empId);
    if (emp?.salary) {
      const monthly = Math.round(emp.salary / 12);
      set('basicSalary', String(monthly));
    }
  };

  const handlePreview = async () => {
    if (!form.basicSalary || Number(form.basicSalary) <= 0) {
      setError('Enter a valid basic salary to preview');
      return;
    }
    try {
      setPreviewing(true);
      setError('');
      const res = await payslipService.previewCalculation({
        basicSalary: Number(form.basicSalary),
        bonus: Number(form.bonus) || 0
      });
      setPreview(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.salaryMonth || !form.basicSalary) {
      setError('Employee, salary month and basic salary are required');
      return;
    }
    if (Number(form.basicSalary) <= 0) {
      setError('Basic salary must be a positive number');
      return;
    }

    const selectedEmp = employees.find(em => em.employeeId === form.employeeId || em.id === form.employeeId);

    try {
      setSubmitting(true);
      setError('');
      await payslipService.generate({
        employeeId: form.employeeId,
        employeeName: selectedEmp?.name || selectedEmp?.firstName + ' ' + selectedEmp?.lastName || form.employeeId,
        department: selectedEmp?.department || '',
        designation: selectedEmp?.designation || '',
        bankAccount: selectedEmp?.bankAccount || '•••• •••• •••• 0000',
        salaryMonth: form.salaryMonth,
        basicSalary: Number(form.basicSalary),
        bonus: Number(form.bonus) || 0,
        notes: form.notes
      });
      onGenerated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate payslip');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmp = employees.find(em => em.employeeId === form.employeeId || em.id === form.employeeId);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Generate Payslip"
      subtitle="Create a new salary slip for an employee. Calculation is done server-side."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Employee + Month Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.employeeId}
              onChange={handleEmployeeChange}
              required
              className="block w-full text-xs rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                  {emp.name || `${emp.firstName} ${emp.lastName}`} — {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Salary Month <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.salaryMonth}
              onChange={(e) => set('salaryMonth', e.target.value)}
              required
              className="block w-full text-xs rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {getLast12Months().map((m) => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Basic Salary + Bonus Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Basic Salary (Monthly) *"
            type="number"
            min="0"
            value={form.basicSalary}
            onChange={(e) => set('basicSalary', e.target.value)}
            placeholder="e.g. 10000"
            helperText={selectedEmp?.salary ? `Annual: $${selectedEmp.salary.toLocaleString()}` : ''}
            required
          />
          <Input
            label="Performance Bonus"
            type="number"
            min="0"
            value={form.bonus}
            onChange={(e) => set('bonus', e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Live Preview */}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={BarChart3}
            onClick={handlePreview}
            disabled={previewing || !form.basicSalary}
          >
            {previewing ? 'Calculating…' : 'Preview Calculation'}
          </Button>

          {preview && (
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Live Calculation Preview</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Basic Salary</span>
                  <span className="font-semibold text-slate-900">{fmt(form.basicSalary)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>HRA</span>
                  <span className="font-semibold">{fmt(preview.allowances?.hra)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Transport</span>
                  <span className="font-semibold">{fmt(preview.allowances?.transportAllowance)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Medical</span>
                  <span className="font-semibold">{fmt(preview.allowances?.medicalAllowance)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Special Allow.</span>
                  <span className="font-semibold">{fmt(preview.allowances?.specialAllowance)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bonus</span>
                  <span className="font-semibold">{fmt(form.bonus)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 mt-2 space-y-1.5">
                <div className="flex justify-between font-bold text-indigo-700">
                  <span>Gross Salary</span>
                  <span>{fmt(preview.grossSalary)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Total Deductions + Tax</span>
                  <span>-{fmt((preview.totalDeductions || 0) + (preview.tax || 0))}</span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-700 text-sm border-t border-emerald-100 pt-2">
                  <span>Net Take-Home</span>
                  <span>{fmt(preview.netSalary)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="Any remarks for this payslip…"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={submitting}>
            {submitting ? 'Generating…' : 'Generate Payslip'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Update Status Modal
// ─────────────────────────────────────────────────────────────────────────────

const UpdateStatusModal = ({ payslip, onClose, onUpdated }) => {
  const [status, setStatus] = useState(payslip.paymentStatus || 'Draft');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await payslipService.updateStatus(payslip._id || payslip.id, { paymentStatus: status });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Update Payment Status"
      subtitle={`${payslip.employeeName} — ${fmtMonth(payslip.salaryMonth)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">{error}</div>
        )}
        <Select
          label="Payment Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={PAYMENT_STATUSES.map(s => ({ value: s, label: s }))}
          required
        />
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-xs">
          Changing status to <strong>Paid</strong> will notify the employee and set the payment date to today.
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update Status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Payslips Page
// ─────────────────────────────────────────────────────────────────────────────

export const Payslips = () => {
  const { user, isAdmin } = useAuth();

  // Data
  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const today = new Date();
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [generateOpen, setGenerateOpen] = useState(false);
  const [updateStatusTarget, setUpdateStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (isAdmin) {
        const [payslipsRes, summaryRes, empsRes] = await Promise.all([
          payslipService.getAll({
            salaryMonth: filterMonth || undefined,
            paymentStatus: filterStatus || undefined,
            employeeId: filterEmployee || undefined,
            page,
            limit: 15
          }),
          payslipService.getSummary(filterMonth || undefined),
          employeeService.getAll({ limit: 100 })
        ]);
        setPayslips(payslipsRes.data || []);
        setTotalPages(payslipsRes.meta?.pagination?.pages || 1);
        setTotalRecords(payslipsRes.meta?.pagination?.total || 0);
        setSummary(summaryRes.data);
        setEmployees(empsRes.data || []);
      } else {
        const res = await payslipService.getMyPayslips({
          salaryMonth: filterMonth || undefined,
          page,
          limit: 12
        });
        setPayslips(res.data || []);
        setTotalPages(res.meta?.pagination?.pages || 1);
        setTotalRecords(res.meta?.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, filterMonth, filterStatus, filterEmployee, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side search on top of server-side filters
  const displayed = payslips.filter((p) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (p.employeeName || '').toLowerCase().includes(s) ||
      (p.employeeId || '').toLowerCase().includes(s) ||
      (p.department || '').toLowerCase().includes(s) ||
      (p._id || '').toLowerCase().includes(s) ||
      (p.id || '').toLowerCase().includes(s)
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await payslipService.delete(deleteTarget._id || deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterStatus('');
    setFilterEmployee('');
    setSearchTerm('');
    setPage(1);
  };

  const hasFilters = filterMonth || filterStatus || filterEmployee || searchTerm;

  // ── KPI Summary Cards (Admin) ──────────────────────────────────────────────
  const KpiCards = () => {
    if (!summary) return null;
    const cards = [
      {
        label: 'Total Net Disbursed',
        value: fmt(summary.totalNetDisbursed),
        sub: `${summary.paidCount} payslips paid`,
        icon: DollarSign,
        color: 'indigo',
        border: 'border-l-indigo-600'
      },
      {
        label: 'Gross Liability',
        value: fmt(summary.totalGrossLiability),
        sub: `${summary.totalPayslips} total payslips`,
        icon: TrendingUp,
        color: 'violet',
        border: 'border-l-violet-600'
      },
      {
        label: 'Processing',
        value: summary.processingCount,
        sub: 'Awaiting disbursement',
        icon: Clock,
        color: 'amber',
        border: 'border-l-amber-500'
      },
      {
        label: 'Draft / Pending',
        value: summary.draftCount,
        sub: 'Not yet finalized',
        icon: AlertTriangle,
        color: 'rose',
        border: 'border-l-rose-500'
      }
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${c.border} p-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{c.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-${c.color}-50 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${c.color}-600`} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{c.value}</div>
              <p className="text-[11px] text-slate-400 mt-1">{c.sub}</p>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Employee My Payslips summary ───────────────────────────────────────────
  const EmployeeSummary = () => {
    const latestPaid = payslips.find((p) => p.paymentStatus === 'Paid');
    const ytdNet = payslips
      .filter((p) => p.paymentStatus === 'Paid' && p.salaryMonth?.startsWith(new Date().getFullYear().toString()))
      .reduce((s, p) => s + (p.netSalary || 0), 0);

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Latest Net Salary</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{fmt(latestPaid?.netSalary)}</div>
          <p className="text-[11px] text-slate-400 mt-1">{latestPaid ? fmtMonth(latestPaid.salaryMonth) : 'No paid payslip'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">YTD Net Income</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{fmt(ytdNet)}</div>
          <p className="text-[11px] text-slate-400 mt-1">{new Date().getFullYear()} cumulative</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Payslips on Record</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalRecords}</div>
          <p className="text-[11px] text-slate-400 mt-1">All months combined</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Payroll & Payslip Management' : 'My Payslips & Compensation'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Generate, process, and manage employee payslips. All calculations are authoritative server-side values.'
              : 'Your official salary statements, earnings breakdown, and printable payslips.'}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setGenerateOpen(true)}
          >
            Generate Payslip
          </Button>
        )}
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      {isAdmin ? <KpiCards /> : <EmployeeSummary />}

      {/* ── Filter Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAdmin ? 'Search employee, ID, dept…' : 'Search payslips…'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400"
            />
          </div>

          {/* Month filter */}
          <select
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400"
          >
            <option value="">All Months</option>
            {getLast12Months().map((m) => (
              <option key={m} value={m}>{fmtMonth(m)}</option>
            ))}
          </select>

          {/* Status filter (admin only) */}
          {isAdmin && (
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="">All Statuses</option>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Refresh */}
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}

          <span className="ml-auto text-[11px] text-slate-400">{totalRecords} records</span>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Payslips Table ───────────────────────────────────────────────────── */}
      <Card
        title="Payslip Registry"
        subtitle="Itemized salary statements with earnings, deductions, and payment records"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500">Loading payslips…</span>
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            title="No payslips found"
            description={hasFilters ? 'Try adjusting your filters' : isAdmin ? 'Generate the first payslip using the button above' : 'No payslips have been generated for your account yet'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Payslip ID</th>
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Pay Month</th>
                    <th className="py-3 px-3">Basic</th>
                    <th className="py-3 px-3">Gross</th>
                    <th className="py-3 px-3 text-rose-500">Deductions</th>
                    <th className="py-3 px-3 text-emerald-600">Net Pay</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {displayed.map((slip) => {
                    const slipId = slip._id || slip.id;
                    const statusCfg = STATUS_CONFIG[slip.paymentStatus] || STATUS_CONFIG.Draft;
                    const StatusIcon = statusCfg.icon;

                    return (
                      <tr key={slipId} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3.5 px-3 font-mono text-[11px] text-indigo-600 font-semibold">
                          <Link to={`/payroll/${slipId}`} className="hover:underline">
                            {slipId.slice(-8).toUpperCase()}
                          </Link>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-900">{slip.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{slip.department} · {slip.employeeId}</div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          {fmtMonth(slip.salaryMonth)}
                        </td>

                        <td className="py-3.5 px-3">{fmt(slip.basicSalary)}</td>

                        <td className="py-3.5 px-3 font-medium text-slate-800">{fmt(slip.grossSalary)}</td>

                        <td className="py-3.5 px-3 text-rose-600 font-medium">
                          -{fmt((slip.totalDeductions || 0) + (slip.tax || 0))}
                        </td>

                        <td className="py-3.5 px-3 font-bold text-emerald-700 text-sm">
                          {fmt(slip.netSalary)}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border
                            ${statusCfg.variant === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              statusCfg.variant === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              statusCfg.variant === 'danger' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            <StatusIcon className="w-3 h-3" />
                            {slip.paymentStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/payroll/${slipId}`}>
                              <Button variant="secondary" size="sm" icon={Eye}>View</Button>
                            </Link>
                            <Link to={`/payroll/${slipId}/print`} target="_blank">
                              <Button variant="outline" size="sm" icon={Printer}>Print</Button>
                            </Link>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={CheckCircle2}
                                  onClick={() => setUpdateStatusTarget(slip)}
                                  title="Update Payment Status"
                                >
                                  Status
                                </Button>
                                {slip.paymentStatus !== 'Paid' && (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => setDeleteTarget(slip)}
                                    title="Delete Payslip"
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 px-2">
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages} · {totalRecords} records
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {generateOpen && (
        <GenerateModal
          employees={employees}
          onClose={() => setGenerateOpen(false)}
          onGenerated={() => { setGenerateOpen(false); fetchData(); }}
        />
      )}

      {updateStatusTarget && (
        <UpdateStatusModal
          payslip={updateStatusTarget}
          onClose={() => setUpdateStatusTarget(null)}
          onUpdated={() => { setUpdateStatusTarget(null); fetchData(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="Delete Payslip"
          subtitle="This action cannot be undone"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <p className="font-semibold">Are you sure you want to delete this payslip?</p>
              <p className="mt-1 text-rose-600">
                {deleteTarget.employeeName} — {fmtMonth(deleteTarget.salaryMonth)} ({deleteTarget.paymentStatus})
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Payslip'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
