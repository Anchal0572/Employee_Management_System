/**
 * Shared System Constants for EMS Backend
 */
const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  DEPARTMENT_HEAD: 'department_head',
  EMPLOYEE: 'employee'
};

const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  PROBATION: 'probation',
  TERMINATED: 'terminated'
};

const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Product',
  'Marketing',
  'Sales',
  'Operations',
  'Legal'
];

const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

module.exports = {
  ROLES,
  EMPLOYEE_STATUS,
  DEPARTMENTS,
  LEAVE_STATUS
};
