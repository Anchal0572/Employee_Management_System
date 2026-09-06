import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { useEMSData } from '../context/EMSDataContext';

export const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { refreshEmployees } = useEMSData();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [apiError, setApiError] = useState('');
  const [employee, setEmployee] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await employeeService.getEmployeeById(id);
        setEmployee(data);

        // Pre-fill form
        const joiningIso = data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : '';
        const salaryVal = typeof data.salary === 'object' ? data.salary?.base : data.salary;

        reset({
          firstName: data.firstName || data.name?.split(' ')[0] || '',
          lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          phone: data.phone || '',
          department: data.department || 'Engineering',
          designation: data.designation || '',
          status: data.status || 'active',
          employmentType: data.employmentType || 'full_time',
          joiningDate: joiningIso,
          salary: salaryVal || 0,
          address: typeof data.address === 'string' ? data.address : `${data.address?.street || ''}, ${data.address?.city || ''}`,
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || '')
        });
      } catch (err) {
        console.error('Failed to load employee details:', err);
        setFetchError(err.message || 'Cannot load employee record');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id, reset]);

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setApiError('');

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        status: formData.status,
        employmentType: formData.employmentType,
        joiningDate: formData.joiningDate,
        salary: parseFloat(formData.salary) || 0,
        address: formData.address,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      await employeeService.updateEmployee(id, payload);

      if (refreshEmployees) refreshEmployees();
      navigate(`/employees/${id}`);
    } catch (err) {
      console.error('Failed to update employee:', err);
      setApiError(err.message || 'Update failed. Please check form fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Only authorized administrators can modify employee personnel records.
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/employees/${id}`)}>
          Back to Employee Details
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium">Retrieving profile record...</p>
      </div>
    );
  }

  if (fetchError || !employee) {
    return (
      <EmptyState
        title="Employee record not found"
        description={`Cannot locate record for employee "${id}". It may have been removed or deactivated.`}
        actionText="Back to Directory"
        onAction={() => navigate('/employees')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link to={`/employees/${id}`} className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Employee Profile
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Employee Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Updating record for <strong className="text-slate-800">{employee.name || `${employee.firstName} ${employee.lastName}`}</strong> (<span className="font-mono text-indigo-600">{employee.employeeId || id}</span>).
        </p>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card title="Personnel Information" subtitle="Update basic contact and naming">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              error={errors.firstName?.message}
              {...register('firstName', { required: 'First name is required' })}
            />
            <Input
              label="Last Name"
              required
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Last name is required' })}
            />
            <Input
              label="Corporate Email"
              type="email"
              required
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Phone Number"
              required
              error={errors.phone?.message}
              {...register('phone', { required: 'Phone is required' })}
            />
          </div>
        </Card>

        <Card title="Job & Compensation" subtitle="Department assignment and salary details">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Department"
              options={[
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Product', label: 'Product & Design' },
                { value: 'Human Resources', label: 'Human Resources' },
                { value: 'Finance', label: 'Finance & Accounting' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Sales', label: 'Sales & BD' },
                { value: 'Legal', label: 'Legal & Compliance' },
                { value: 'Operations', label: 'Operations' }
              ]}
              {...register('department', { required: 'Department is required' })}
            />
            <Input
              label="Designation"
              required
              error={errors.designation?.message}
              {...register('designation', { required: 'Designation is required' })}
            />
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'on_leave', label: 'On Leave' },
                { value: 'probation', label: 'Probation' },
                { value: 'terminated', label: 'Terminated' }
              ]}
              {...register('status')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Select
              label="Employment Type"
              options={[
                { value: 'full_time', label: 'Full Time' },
                { value: 'part_time', label: 'Part Time' },
                { value: 'contract', label: 'Contractor' },
                { value: 'intern', label: 'Intern' }
              ]}
              {...register('employmentType')}
            />
            <Input
              label="Joining Date"
              type="date"
              required
              error={errors.joiningDate?.message}
              {...register('joiningDate', { required: 'Joining date is required' })}
            />
            <Input
              label="Annual Base Salary ($)"
              type="number"
              required
              error={errors.salary?.message}
              {...register('salary', { required: 'Salary is required' })}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Skills & Expertise"
              placeholder="e.g. Distributed Systems, Kubernetes, React"
              {...register('skills')}
            />
          </div>
        </Card>

        <Card title="Residential Address" subtitle="Location and physical mailing details">
          <Input
            label="Full Address"
            placeholder="e.g. 500 Howard St, Suite 400, San Francisco, CA 94105"
            {...register('address')}
          />
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/employees/${id}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={submitting ? Loader2 : Save}
            disabled={submitting}
          >
            {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
