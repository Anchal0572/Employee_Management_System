import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Shield,
  Edit2,
  ArrowLeft,
  Clock,
  CalendarDays,
  FileText,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';

export const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await employeeService.getEmployeeById(id);
        setEmployee(data);
      } catch (err) {
        console.error('Failed to load employee details:', err);
        setError(err.message || 'Unable to retrieve employee profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployeeDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium">Loading comprehensive employee profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <EmptyState
        title="Employee record not found"
        description={`No active profile matches ID "${id}". The record may have been deleted.`}
        actionText="Back to Directory"
        onAction={() => navigate('/employees')}
      />
    );
  }

  const displayName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  const empId = employee.employeeId || employee._id || employee.id;
  const joiningFormatted = employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const salaryValue = typeof employee.salary === 'object' ? employee.salary?.base : employee.salary;

  // 360 Summaries from API
  const attendanceSummary = employee.attendanceSummary || {
    presentDays: 21,
    absentDays: 1,
    shiftsLogged: 22,
    presentRate: 95.5,
    punctualityRate: 91.0,
    recentLogs: []
  };

  const leaveSummary = employee.leaveSummary || {
    annualRemaining: 14,
    sickRemaining: 8,
    casualRemaining: 4,
    totalTakenYearToDate: 5,
    recentApplications: []
  };

  const payslipSummary = employee.payslipSummary || {
    annualBase: salaryValue || 0,
    monthlyGross: Math.round((salaryValue || 0) / 12),
    latestDisbursement: {
      period: 'Recent Period',
      paymentDate: 'Processed',
      netPay: Math.round(((salaryValue || 0) / 12) * 0.78),
      status: 'processed'
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link to="/employees" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Employees
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to={`/employees/${empId}/edit`}>
              <Button variant="secondary" size="sm" icon={Edit2}>
                Edit Profile
              </Button>
            </Link>
          )}
          <Link to="/payroll">
            <Button variant="primary" size="sm" icon={FileText}>
              Payroll Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-100 shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
                <Badge
                  variant={employee.status === 'active' ? 'success' : employee.status === 'on_leave' ? 'warning' : 'neutral'}
                  dot
                >
                  {employee.status || 'active'}
                </Badge>
              </div>
              <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                <span>{employee.designation}</span> • <span className="text-indigo-600 font-semibold">{employee.department}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1 font-mono text-indigo-600 font-semibold">
                  ID: {empId}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {joiningFormatted}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto text-xs border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{employee.phone || '+1 (555) 000-0000'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{typeof employee.address === 'string' ? employee.address : 'San Francisco, CA'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Bio
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Attendance 360°
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'leaves'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Balances
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'payroll'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Compensation & Payroll
          </button>
        </div>
      </Card>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Employment Details" className="lg:col-span-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Employee Identifier</dt>
                <dd className="font-semibold font-mono text-indigo-600 mt-0.5">{empId}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Department Assignment</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{employee.department}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Position / Title</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{employee.designation}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Employment Classification</dt>
                <dd className="font-semibold text-slate-800 capitalize mt-0.5">
                  {employee.employmentType ? employee.employmentType.replace('_', ' ') : 'Full Time'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Reporting Line</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{employee.manager || 'Executive Management'}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Official Joining Date</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{joiningFormatted}</dd>
              </div>
            </dl>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Recognized Skills & Specializations</h4>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(employee.skills) && employee.skills.length > 0 ? (
                  employee.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">General Corporate Specialization</span>
                )}
              </div>
            </div>
          </Card>

          {/* Emergency Contact & Safety */}
          <div className="space-y-6">
            <Card title="Emergency Contact">
              <div className="text-xs space-y-2 text-slate-700">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Contact Person</span>
                  <span className="font-semibold">{employee.emergencyContact?.name || 'Jane Doe'}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Relationship</span>
                  <span className="font-semibold capitalize">{employee.emergencyContact?.relation || employee.emergencyContact?.relationship || 'Family'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Emergency Phone</span>
                  <span className="font-mono text-indigo-600 font-medium">{employee.emergencyContact?.phone || '+1 (555) 999-0000'}</span>
                </div>
              </div>
            </Card>

            <Card title="Role Security Status">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-slate-800">System Role: {employee.user?.role || (isAdmin ? 'Admin' : 'Employee')}</p>
                  <p className="text-slate-400 text-[11px]">Last Session Verified</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance 360 */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Present Rate</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{attendanceSummary.presentRate}%</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ {attendanceSummary.presentDays} Days Present</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Punctuality Score</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{attendanceSummary.punctualityRate}%</p>
              <p className="text-[11px] text-indigo-600 font-medium mt-1">Average Check-in: 08:58 AM</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Total Shifts Logged</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{attendanceSummary.shiftsLogged}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Current Billing Cycle</p>
            </Card>
          </div>

          <Card title="Recent Biometric Check-In Logs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Check-Out</th>
                    <th className="py-2.5 px-3">Hours</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendanceSummary.recentLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono">{log.date}</td>
                      <td className="py-2.5 px-3">{log.checkIn}</td>
                      <td className="py-2.5 px-3">{log.checkOut}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{log.hoursWorked} hrs</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="success" dot size="sm">Present</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Leaves */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Annual Leave Balance</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{leaveSummary.annualRemaining} <span className="text-xs text-slate-400 font-normal">days left</span></p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Sick Leave Balance</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{leaveSummary.sickRemaining} <span className="text-xs text-slate-400 font-normal">days left</span></p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Casual Leave</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{leaveSummary.casualRemaining} <span className="text-xs text-slate-400 font-normal">days left</span></p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Taken Year-to-Date</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{leaveSummary.totalTakenYearToDate} <span className="text-xs text-slate-400 font-normal">days</span></p>
            </Card>
          </div>

          <Card title="Recent Leave Requests & History">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Leave Type</th>
                    <th className="py-2.5 px-3">Dates</th>
                    <th className="py-2.5 px-3">Days</th>
                    <th className="py-2.5 px-3">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leaveSummary.recentApplications.map((app, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{app.type}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{app.dates}</td>
                      <td className="py-2.5 px-3">{app.days} Day(s)</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={app.status === 'approved' ? 'success' : 'warning'} dot size="sm">
                          {app.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Compensation & Payroll */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Annual Base Compensation</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${(salaryValue || 0).toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-1">USD • Semi-Monthly Payroll</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Monthly Gross Equivalent</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">${payslipSummary.monthlyGross.toLocaleString()}</p>
              <p className="text-[11px] text-indigo-500 mt-1">Standard 40-hr baseline</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400">Estimated Net Disbursement</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">${payslipSummary.latestDisbursement.netPay.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-600 mt-1">After standard withholdings</p>
            </Card>
          </div>

          <Card title="Latest Payroll Disbursement Overview">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900">Period: {payslipSummary.latestDisbursement.period}</p>
                <p className="text-[11px] text-slate-500">Scheduled Payout: {payslipSummary.latestDisbursement.paymentDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success" dot>Processed</Badge>
                <Link to="/payroll">
                  <Button variant="secondary" size="sm" icon={FileText}>
                    View Detailed Payslips
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
