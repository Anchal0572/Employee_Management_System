import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Printer, Building2, Calendar, CreditCard,
  CheckCircle2, FileText, Clock, AlertTriangle, XCircle,
  RefreshCw, DollarSign, Shield
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { payslipService } from '../services/payslipService';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;
const fmtMonth = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

const STATUS_CONFIG = {
  Draft:      { variant: 'neutral',  icon: Clock,        color: 'slate' },
  Processing: { variant: 'warning',  icon: AlertTriangle, color: 'amber' },
  Paid:       { variant: 'success',  icon: CheckCircle2, color: 'emerald' },
  Failed:     { variant: 'danger',   icon: XCircle,      color: 'rose' },
  Cancelled:  { variant: 'neutral',  icon: XCircle,      color: 'slate' }
};

export const PayslipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await payslipService.getById(id);
        setPayslip(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load payslip');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-500">Loading payslip…</span>
        </div>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <EmptyState
        title="Payslip not found"
        description={error || 'The requested salary slip is unavailable or you do not have access.'}
        actionText="Back to Payroll"
        onAction={() => navigate('/payroll')}
      />
    );
  }

  const slipId = payslip._id || payslip.id;
  const statusCfg = STATUS_CONFIG[payslip.paymentStatus] || STATUS_CONFIG.Draft;
  const StatusIcon = statusCfg.icon;
  const a = payslip.allowances || {};
  const d = payslip.deductions || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link to="/payroll" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Payroll
        </Link>
        <Link to={`/payroll/${slipId}/print`} target="_blank">
          <Button variant="primary" icon={Printer}>
            Print / Save PDF
          </Button>
        </Link>
      </div>

      {/* Main Payslip Statement */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Company and Slip Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                EMS
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">WorkPulse Technologies Inc.</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Salary Statement</h1>
            <p className="text-xs text-slate-500">Pay Period: {fmtMonth(payslip.salaryMonth)} (1st – Last day)</p>
          </div>

          <div className="text-right space-y-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
              ${statusCfg.variant === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                statusCfg.variant === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                statusCfg.variant === 'danger' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-slate-50 text-slate-600 border-slate-200'}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {payslip.paymentStatus}
            </span>
            <p className="text-xs text-slate-500 font-mono">Ref: {slipId.slice(-12).toUpperCase()}</p>
          </div>
        </div>

        {/* Employee Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Employee</span>
            <div className="font-semibold text-slate-900 mt-0.5">{payslip.employeeName}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Designation</span>
            <div className="font-semibold text-slate-900 mt-0.5">{payslip.designation || 'N/A'}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
            <div className="font-semibold text-slate-900 mt-0.5">{payslip.department || 'N/A'}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Employee ID</span>
            <div className="font-semibold text-slate-900 mt-0.5 font-mono">{payslip.employeeId}</div>
          </div>
        </div>

        {/* Itemized Breakdown Table: Earnings vs Deductions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Earnings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              Earnings
            </h3>
            <dl className="divide-y divide-slate-100 text-xs mt-2">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">Basic Salary</dt>
                <dd className="font-semibold text-slate-900">{fmt(payslip.basicSalary)}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">House Rent Allowance (HRA)</dt>
                <dd className="font-semibold text-slate-900">{fmt(a.hra)}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">Transport Allowance</dt>
                <dd className="font-semibold text-slate-900">{fmt(a.transportAllowance)}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">Medical Allowance</dt>
                <dd className="font-semibold text-slate-900">{fmt(a.medicalAllowance)}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">Special Allowance</dt>
                <dd className="font-semibold text-slate-900">{fmt(a.specialAllowance)}</dd>
              </div>
              {(payslip.bonus || 0) > 0 && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-600">Performance Bonus</dt>
                  <dd className="font-semibold text-emerald-700">{fmt(payslip.bonus)}</dd>
                </div>
              )}
              <div className="py-3 flex justify-between bg-slate-50 px-2 rounded font-bold text-slate-900">
                <dt>Total Gross Earnings</dt>
                <dd className="text-indigo-600">{fmt(payslip.grossSalary)}</dd>
              </div>
            </dl>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              Deductions & Taxes
            </h3>
            <dl className="divide-y divide-slate-100 text-xs mt-2">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">Provident Fund (PF)</dt>
                <dd className="font-semibold text-slate-900">{fmt(d.providentFund)}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">Professional Tax</dt>
                <dd className="font-semibold text-slate-900">{fmt(d.professionalTax)}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600">Health Insurance Premium</dt>
                <dd className="font-semibold text-slate-900">{fmt(d.healthInsurance)}</dd>
              </div>
              {(d.loanDeduction || 0) > 0 && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-600">Loan Deduction</dt>
                  <dd className="font-semibold text-slate-900">{fmt(d.loanDeduction)}</dd>
                </div>
              )}
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600 font-medium">Income Tax (TDS)</dt>
                <dd className="font-semibold text-slate-900">{fmt(payslip.tax)}</dd>
              </div>
              <div className="py-3 flex justify-between bg-slate-50 px-2 rounded font-bold text-slate-900">
                <dt>Total Deductions</dt>
                <dd className="text-rose-600">-{fmt((payslip.totalDeductions || 0) + (payslip.tax || 0))}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Net Take-Home Highlight Card */}
        <div className="p-6 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold text-indigo-700">Net Take-Home Salary</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {fmt(payslip.netSalary)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Disbursed to: <strong className="text-slate-700">{payslip.bankAccount || 'N/A'}</strong>
            </p>
          </div>

          <Link to={`/payroll/${slipId}/print`} target="_blank">
            <Button variant="primary" icon={Printer}>
              Print Salary Slip
            </Button>
          </Link>
        </div>

        {/* Meta Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-t border-slate-100 pt-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Generated</span>
            <div className="text-slate-700 mt-0.5">
              {payslip.generatedAt ? new Date(payslip.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Generated By</span>
            <div className="text-slate-700 mt-0.5">{payslip.generatedByName || 'System'}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Payment Date</span>
            <div className="text-slate-700 mt-0.5">
              {payslip.paymentDate ? new Date(payslip.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
            </div>
          </div>
          {payslip.notes && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Notes</span>
              <div className="text-slate-700 mt-0.5">{payslip.notes}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
