import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Building2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { useEMSData } from '../context/EMSDataContext';

export const Employees = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { refreshEmployees } = useEMSData();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 8,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal State for Delete Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Department List
  const departments = [
    'All',
    'Engineering',
    'Human Resources',
    'Finance',
    'Product',
    'Legal',
    'Operations',
    'Marketing',
    'Sales'
  ];

  // Fetch employees from backend
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await employeeService.getEmployees({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        department: selectedDept,
        status: selectedStatus,
        sortBy: sortField,
        order: sortOrder
      });

      setEmployees(res.employees);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError(err.message || 'Unable to retrieve employee records');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, selectedDept, selectedStatus, sortField, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Open Delete Confirmation Modal
  const openDeleteDialog = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteModalOpen(true);
    setActiveMenuId(null);
  };

  // Execute Deletion
  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      setIsDeleting(true);
      const targetId = employeeToDelete.employeeId || employeeToDelete._id || employeeToDelete.id;
      await employeeService.deleteEmployee(targetId);

      setSuccessToast(`Employee ${employeeToDelete.firstName || employeeToDelete.name} was successfully removed.`);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);

      // Refresh list
      fetchEmployees();
      if (refreshEmployees) refreshEmployees();

      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete employee record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {successToast && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees Directory</h1>
            <Badge variant="neutral" size="sm">
              {pagination.total} Registered
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise staff database with multi-field search, department allocation, and role-based records.
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Link to="/employees/new">
              <Button variant="primary" icon={Plus}>
                Add Employee
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Card>
        {/* Controls Bar: Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, email, or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                {departments.map((d, i) => (
                  <option key={i} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="probation">Probation</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Fetching verified employee directory records...</p>
            </div>
          ) : error ? (
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-semibold text-rose-600 mb-2">Error connecting to server</p>
              <p className="text-xs text-slate-500 mb-4">{error}</p>
              <Button size="sm" variant="secondary" onClick={fetchEmployees}>
                Retry Loading
              </Button>
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              title="No employees found"
              description="No personnel records matched your search query or filter selections."
              actionText="Reset All Filters"
              onAction={() => {
                setSearchTerm('');
                setSelectedDept('All');
                setSelectedStatus('All');
                setCurrentPage(1);
              }}
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => toggleSort('firstName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Employee</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => toggleSort('department')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Department</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Designation</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => toggleSort('joiningDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Joining Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {employees.map((emp) => {
                  const empId = emp.employeeId || emp._id || emp.id;
                  const displayName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Staff Member';
                  const formattedDate = emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

                  return (
                    <tr key={empId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                            alt={displayName}
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/employees/${empId}`}
                              className="font-semibold text-slate-900 hover:text-indigo-600 block truncate"
                            >
                              {displayName}
                            </Link>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {emp.email} • <span className="font-mono text-indigo-600 font-medium">{emp.employeeId || empId}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {emp.department}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-3 font-medium text-slate-800">{emp.designation}</td>

                      {/* Join Date */}
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{formattedDate}</td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            emp.status === 'active'
                              ? 'success'
                              : emp.status === 'on_leave'
                              ? 'warning'
                              : emp.status === 'terminated'
                              ? 'danger'
                              : 'info'
                          }
                          dot
                        >
                          {emp.status === 'active'
                            ? 'Active'
                            : emp.status === 'on_leave'
                            ? 'On Leave'
                            : emp.status === 'terminated'
                            ? 'Terminated'
                            : 'Probation'}
                        </Badge>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3 px-3 text-right relative">
                        <div className="inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === empId ? null : empId)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuId === empId && (
                            <div className="absolute right-3 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                              <Link
                                to={`/employees/${empId}`}
                                onClick={() => setActiveMenuId(null)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View 360° Profile</span>
                              </Link>

                              {isAdmin && (
                                <Link
                                  to={`/employees/${empId}/edit`}
                                  onClick={() => setActiveMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Edit Details</span>
                                </Link>
                              )}

                              <Link
                                to="/payroll"
                                onClick={() => setActiveMenuId(null)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Payroll & Compensation</span>
                              </Link>

                              {isAdmin && (
                                <>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => openDeleteDialog(emp)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete Record</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{employees.length}</strong> of{' '}
            <strong className="text-slate-800">{pagination.total}</strong> registered employees
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
              Page {pagination.currentPage || currentPage} of {pagination.totalPages || 1}
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
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Employee Deletion</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p>
                Are you sure you want to permanently remove employee{' '}
                <strong className="text-slate-900">{employeeToDelete.name || `${employeeToDelete.firstName} ${employeeToDelete.lastName}`}</strong>{' '}
                (<span className="font-mono text-indigo-600 font-semibold">{employeeToDelete.employeeId || employeeToDelete.id}</span>)?
              </p>
              <p className="text-[11px] text-slate-400">
                Their user associations, profile data, and department assignments will be purged from the active system.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEmployeeToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isDeleting}
                onClick={confirmDelete}
                icon={isDeleting ? Loader2 : Trash2}
              >
                {isDeleting ? 'Deleting...' : 'Delete Employee'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
