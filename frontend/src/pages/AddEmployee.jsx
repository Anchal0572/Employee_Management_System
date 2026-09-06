import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, UserPlus, Save, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { useEMSData } from '../context/EMSDataContext';

export const AddEmployee = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { refreshEmployees } = useEMSData();

  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      status: 'active',
      department: 'Engineering',
      employmentType: 'full_time',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: 125000,
      phone: '+1 (555) 342-9100',
      addressStreet: '100 Silicon Way',
      addressCity: 'San Francisco',
      addressState: 'CA',
      addressZip: '94107',
      emergencyName: 'Jane Doe',
      emergencyRelation: 'Spouse',
      emergencyPhone: '+1 (555) 998-1122'
    }
  });

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setApiError('');

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        employmentType: formData.employmentType,
        status: formData.status,
        joiningDate: formData.joiningDate,
        salary: parseFloat(formData.salary) || 0,
        address: `${formData.addressStreet || ''}, ${formData.addressCity || ''}, ${formData.addressState || ''} ${formData.addressZip || ''}`.trim(),
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone
        },
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : ['Cross-functional Collaboration']
      };

      const created = await employeeService.createEmployee(payload);

      if (refreshEmployees) refreshEmployees();
      navigate(`/employees/${created.employeeId || created._id || created.id}`);
    } catch (err) {
      console.error('Failed to create employee:', err);
      setApiError(err.message || 'An error occurred while creating employee');
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
          Only corporate administrators have permission to onboard new staff.
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/employees')}>
          Return to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/employees" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Directory
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Onboard New Employee</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill out candidate details, departmental assignment, and compensation package.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal Identification */}
        <Card title="Personal Details" subtitle="Primary identification and contact points">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="e.g. Alexander"
              required
              error={errors.firstName?.message}
              {...register('firstName', { required: 'First name is required' })}
            />

            <Input
              label="Last Name"
              placeholder="e.g. Wright"
              required
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Last name is required' })}
            />

            <Input
              label="Corporate Work Email"
              type="email"
              placeholder="alexander.w@ems.corp"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Work email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Enter a valid corporate email'
                }
              })}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              required
              error={errors.phone?.message}
              {...register('phone', { required: 'Phone number is required' })}
            />
          </div>
        </Card>

        {/* Section 2: Role & Department Assignment */}
        <Card title="Organizational Placement" subtitle="Designation, department and employment type">
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
              label="Designation / Title"
              placeholder="e.g. Senior Security Architect"
              required
              error={errors.designation?.message}
              {...register('designation', { required: 'Designation is required' })}
            />

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Select
              label="Initial Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'probation', label: 'Probation' },
                { value: 'on_leave', label: 'On Leave' }
              ]}
              {...register('status')}
            />

            <Input
              label="Joining Date"
              type="date"
              required
              error={errors.joiningDate?.message}
              {...register('joiningDate', { required: 'Joining date is required' })}
            />

            <Input
              label="Annual Base Salary (USD)"
              type="number"
              placeholder="125000"
              required
              error={errors.salary?.message}
              {...register('salary', {
                required: 'Salary is required',
                min: { value: 1000, message: 'Salary must be greater than 0' }
              })}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Core Competencies & Skills (comma-separated)"
              placeholder="e.g. React, Node.js, Cloud Architecture, Kubernetes"
              {...register('skills')}
            />
          </div>
        </Card>

        {/* Section 3: Residential & Emergency Contact */}
        <Card title="Residential & Emergency Contact" subtitle="Physical address and emergency contact details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Street Address"
              placeholder="e.g. 500 Howard St, Suite 400"
              {...register('addressStreet')}
            />

            <div className="grid grid-cols-3 gap-2">
              <Input
                label="City"
                placeholder="City"
                {...register('addressCity')}
              />
              <Input
                label="State"
                placeholder="CA"
                {...register('addressState')}
              />
              <Input
                label="Zip"
                placeholder="94105"
                {...register('addressZip')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Input
              label="Emergency Contact Name"
              placeholder="e.g. Jane Wright"
              {...register('emergencyName')}
            />
            <Input
              label="Relationship"
              placeholder="e.g. Spouse"
              {...register('emergencyRelation')}
            />
            <Input
              label="Emergency Phone"
              placeholder="+1 (555) 998-1122"
              {...register('emergencyPhone')}
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/employees')}
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
            {submitting ? 'Registering...' : 'Save & Onboard Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
};
