import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  FileText,
  AlertCircle,
  TrendingUp,
  Download,
  Calendar,
  CreditCard,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { expenseService } from '../services/expenseService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const CATEGORIES = [
  'All',
  'Travel & Commute',
  'Office Supplies & Hardware',
  'Internet & Phone',
  'Client Entertainment',
  'Health & Wellness',
  'Learning & Books'
];

const STATUSES = ['All', 'Pending', 'Approved', 'Rejected'];

export const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [metrics, setMetrics] = useState({
    totalClaims: 0,
    totalClaimedAmount: 0,
    totalApprovedAmount: 0,
    pendingReviewCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [reviewModalData, setReviewModalData] = useState(null); // { expense, action: 'Approved'|'Rejected' }
  const [adminRemark, setAdminRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [claimForm, setClaimForm] = useState({
    title: '',
    category: 'Internet & Phone',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
    receiptName: 'Receipt_Attachment.pdf'
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseService.getExpenses({
        status: selectedStatus,
        category: selectedCategory
      });
      setExpenses(res.expenses);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedStatus, selectedCategory]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimForm.title || !claimForm.amount) return;

    setSubmitting(true);
    try {
      await expenseService.submitExpense(claimForm);
      setIsSubmitModalOpen(false);
      setClaimForm({
        title: '',
        category: 'Internet & Phone',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: '',
        receiptName: 'Receipt_Attachment.pdf'
      });
      fetchExpenses();
    } catch (err) {
      console.error('Failed to submit claim:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewDecision = async () => {
    if (!reviewModalData) return;
    setSubmitting(true);
    try {
      await expenseService.reviewExpense(reviewModalData.expense._id, {
        status: reviewModalData.action,
        adminRemarks: adminRemark || `Claim ${reviewModalData.action.toLowerCase()} by HR administration.`
      });
      setReviewModalData(null);
      setAdminRemark('');
      fetchExpenses();
    } catch (err) {
      console.error('Review decision failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Reimbursed':
        return <Badge variant="success">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl text-white shadow-lg shadow-teal-500/15 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Expense Claims & Reimbursements</h1>
              <p className="text-xs text-teal-100 font-medium">
                Seamless business reimbursement workflow with automated payroll disbursement integration.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            id="new-expense-claim-btn"
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 font-extrabold text-xs rounded-xl shadow-md border border-teal-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-800 stroke-[2.5]" />
            <span className="font-extrabold text-teal-800 tracking-tight">New Expense Claim</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Claims Filed</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalClaims}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">All Recorded Filings</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Claimed ($)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">${metrics.totalClaimedAmount.toLocaleString()}</div>
          <p className="text-[11px] text-teal-600 font-semibold mt-1">Gross Submissions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved for Payout</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">${metrics.totalApprovedAmount.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Synced to Payslip
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pendingReviewCount}</div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Awaiting Approvals</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Claims Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">Loading reimbursement records...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No expense claims found</h3>
            <p className="text-xs text-slate-400 mt-1">Submit a new claim to request corporate reimbursement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Claim Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  {user?.role === 'admin' && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{exp.title}</span>
                      {exp.notes && <span className="text-[11px] text-slate-400 block truncate">{exp.notes}</span>}
                      {exp.adminRemarks && (
                        <span className="text-[10px] text-indigo-600 block mt-0.5">
                          Remark: {exp.adminRemarks}
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{exp.employeeName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{exp.employeeId}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap font-black text-slate-900 text-sm">
                      ${Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStatusBadge(exp.status)}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="p-4 whitespace-nowrap text-right">
                        {exp.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModalData({ expense: exp, action: 'Approved' });
                                setAdminRemark('Approved for monthly payroll disbursement.');
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModalData({ expense: exp, action: 'Rejected' });
                                setAdminRemark('Claim requires additional invoice details.');
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Reviewed by {exp.reviewedBy || 'Admin'}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Claim Modal */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit New Expense Claim"
        >
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <Input
              label="Expense Title / Description"
              required
              placeholder="e.g. Flight to Tech Architecture Conference"
              value={claimForm.title}
              onChange={(e) => setClaimForm({ ...claimForm, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={claimForm.category}
                  onChange={(e) => setClaimForm({ ...claimForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Travel & Commute">Travel & Commute</option>
                  <option value="Office Supplies & Hardware">Office Supplies & Hardware</option>
                  <option value="Internet & Phone">Internet & Phone</option>
                  <option value="Client Entertainment">Client Entertainment</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Learning & Books">Learning & Books</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <Input
                label="Amount ($ USD)"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={claimForm.amount}
                onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
              />
            </div>

            <Input
              label="Expense Date"
              type="date"
              required
              value={claimForm.expenseDate}
              onChange={(e) => setClaimForm({ ...claimForm, expenseDate: e.target.value })}
            />

            <div className="p-4 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 text-center">
              <FileText className="w-8 h-8 text-teal-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Simulated Receipt Upload</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Attached: {claimForm.receiptName}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Business Justification / Purpose
              </label>
              <textarea
                rows={3}
                placeholder="Explain the business context of this expenditure..."
                value={claimForm.notes}
                onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="bg-teal-600 hover:bg-teal-700">
                Submit For Reimbursement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Review Decision Modal */}
      {reviewModalData && (
        <Modal
          isOpen={Boolean(reviewModalData)}
          onClose={() => setReviewModalData(null)}
          title={`Review Expense Claim: ${reviewModalData.action}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{reviewModalData.expense.title}</div>
              <div className="text-slate-500 mt-1">
                Claimed: <strong className="text-slate-900">${Number(reviewModalData.expense.amount).toFixed(2)}</strong> by {reviewModalData.expense.employeeName}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Audit Review Remark
              </label>
              <textarea
                rows={3}
                value={adminRemark}
                onChange={(e) => setAdminRemark(e.target.value)}
                placeholder="Provide decision reason or instruction..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setReviewModalData(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleReviewDecision}
                loading={submitting}
                className={reviewModalData.action === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                Confirm {reviewModalData.action}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Expenses;
