import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { payslipService } from '../services/payslipService';

const fmt = (n) => `$${(n || 0).toLocaleString()}`;
const fmtMonth = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Convert a number to words (simplified, handles up to millions)
 */
const numberToWords = (n) => {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (num) => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    return convert(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 ? ' ' + convert(num % 1000000) : '');
  };
  return convert(Math.round(n)) + ' US Dollars Only';
};

export const PrintablePayslip = () => {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-sm text-slate-500">Loading payslip…</span>
        </div>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center space-y-3">
          <p className="text-slate-700 font-medium">{error || 'Payslip not found'}</p>
          <Link to="/payroll" className="text-indigo-600 text-sm underline">Back to Payroll</Link>
        </div>
      </div>
    );
  }

  const slipId = payslip._id || payslip.id;
  const a = payslip.allowances || {};
  const d = payslip.deductions || {};
  const totalDeductionsAndTax = (payslip.totalDeductions || 0) + (payslip.tax || 0);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
      {/* Floating Action Bar (Hidden during Print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link to="/payroll" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to EMS
        </Link>
        <Button variant="primary" icon={Printer} onClick={handlePrint}>
          Print Document
        </Button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-6 print:rounded-none">
        {/* Company Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                EMS
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">WORKPULSE TECHNOLOGIES INC.</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">100 Silicon Way, Suite 400 • San Francisco, CA 94107</p>
            <p className="text-xs text-slate-500">Corporate Tax ID: EIN-94-3829104 • payroll@ems.corp</p>
          </div>

          <div className="text-right">
            <h2 className="text-lg font-bold uppercase text-slate-900">Salary Slip</h2>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">Pay Period: {fmtMonth(payslip.salaryMonth)}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">Ref: {slipId.slice(-12).toUpperCase()}</p>
          </div>
        </div>

        {/* Employee Particulars */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-6 border-b border-slate-200 text-xs">
          <div><span className="text-slate-500">Employee Name:</span> <strong className="text-slate-900">{payslip.employeeName}</strong></div>
          <div><span className="text-slate-500">Employee ID:</span> <strong className="text-slate-900 font-mono">{payslip.employeeId}</strong></div>
          <div><span className="text-slate-500">Designation:</span> <strong className="text-slate-900">{payslip.designation || 'N/A'}</strong></div>
          <div><span className="text-slate-500">Department:</span> <strong className="text-slate-900">{payslip.department || 'N/A'}</strong></div>
          <div><span className="text-slate-500">Disbursement Date:</span> <strong className="text-slate-900">{payslip.paymentDate ? new Date(payslip.paymentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending'}</strong></div>
          <div><span className="text-slate-500">Bank Account:</span> <strong className="text-slate-900">{payslip.bankAccount || 'N/A'}</strong></div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="py-6 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-8">
            {/* Earnings */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                    <th className="py-2 text-left">Earnings</th>
                    <th className="py-2 text-right">Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="py-2 text-slate-600">Basic Salary</td><td className="py-2 text-right font-medium">{fmt(payslip.basicSalary)}</td></tr>
                  <tr><td className="py-2 text-slate-600">House Rent Allowance (HRA)</td><td className="py-2 text-right font-medium">{fmt(a.hra)}</td></tr>
                  <tr><td className="py-2 text-slate-600">Transport Allowance</td><td className="py-2 text-right font-medium">{fmt(a.transportAllowance)}</td></tr>
                  <tr><td className="py-2 text-slate-600">Medical Allowance</td><td className="py-2 text-right font-medium">{fmt(a.medicalAllowance)}</td></tr>
                  <tr><td className="py-2 text-slate-600">Special Allowance</td><td className="py-2 text-right font-medium">{fmt(a.specialAllowance)}</td></tr>
                  {(payslip.bonus || 0) > 0 && (
                    <tr><td className="py-2 text-slate-600">Performance Bonus</td><td className="py-2 text-right font-medium">{fmt(payslip.bonus)}</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold">
                    <td className="py-2.5">Gross Earnings</td>
                    <td className="py-2.5 text-right text-indigo-700">{fmt(payslip.grossSalary)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                    <th className="py-2 text-left">Deductions</th>
                    <th className="py-2 text-right">Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="py-2 text-slate-600">Provident Fund (PF)</td><td className="py-2 text-right font-medium">{fmt(d.providentFund)}</td></tr>
                  <tr><td className="py-2 text-slate-600">Professional Tax</td><td className="py-2 text-right font-medium">{fmt(d.professionalTax)}</td></tr>
                  <tr><td className="py-2 text-slate-600">Health Insurance Premium</td><td className="py-2 text-right font-medium">{fmt(d.healthInsurance)}</td></tr>
                  {(d.loanDeduction || 0) > 0 && (
                    <tr><td className="py-2 text-slate-600">Loan Deduction</td><td className="py-2 text-right font-medium">{fmt(d.loanDeduction)}</td></tr>
                  )}
                  <tr><td className="py-2 text-slate-600 font-medium">Income Tax (TDS)</td><td className="py-2 text-right font-medium">{fmt(payslip.tax)}</td></tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold">
                    <td className="py-2.5">Total Deductions</td>
                    <td className="py-2.5 text-right text-rose-600">-{fmt(totalDeductionsAndTax)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Net Salary Highlight Box */}
        <div className="py-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 px-6 rounded-xl my-4">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500">Net Salary Payable</span>
            <p className="text-[11px] text-slate-500 mt-0.5">{numberToWords(payslip.netSalary)}</p>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {fmt(payslip.netSalary)}
          </div>
        </div>

        {/* Payment Status Badge */}
        <div className="flex items-center justify-center py-3">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border
            ${payslip.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              payslip.paymentStatus === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-50 text-slate-600 border-slate-200'}`}>
            Payment Status: {payslip.paymentStatus}
          </span>
        </div>

        {/* Signatures & Footer Notice */}
        <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="w-48 mx-auto border-b border-slate-300 pb-1 font-serif italic text-slate-600">
              Anchal Keshri
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Authorized Payroll Officer</p>
          </div>
          <div>
            <div className="w-48 mx-auto border-b border-slate-300 pb-1 font-serif italic text-slate-600">
              {payslip.employeeName}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Employee Signature / Acknowledgment</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          This is a computer-generated document and serves as an official proof of salary disbursement. Confidential.
          <br />
          Generated on: {payslip.generatedAt ? new Date(payslip.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
        </div>
      </div>
    </div>
  );
};
