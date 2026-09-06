const { getDbStatus } = require('../config/db');
const Employee = require('../models/Employee');
const ApiError = require('../utils/apiError');
const eventDispatcher = require('../jobs/eventDispatcher');

/**
 * Initial dataset for memory store fallback in local dev without active MongoDB
 */
const INITIAL_SEED_EMPLOYEES = [
  {
    _id: '66e1b0000000000000000001',
    employeeId: 'EMP-001',
    firstName: 'Sophia',
    lastName: 'Chen',
    name: 'Sophia Chen',
    email: 'sophia.chen@ems.corp',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    designation: 'Staff Software Engineer',
    joiningDate: new Date('2022-03-15'),
    employmentType: 'full_time',
    salary: 135000,
    address: '452 Market Street, San Francisco, CA',
    emergencyContact: { name: 'David Chen', relation: 'Spouse', phone: '+1 (555) 234-9988' },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    skills: ['React', 'Node.js', 'System Architecture', 'TypeScript', 'MongoDB'],
    manager: 'Marcus Vance',
    createdAt: new Date('2022-03-15')
  },
  {
    _id: '66e1b0000000000000000002',
    employeeId: 'EMP-002',
    firstName: 'Marcus',
    lastName: 'Vance',
    name: 'Marcus Vance',
    email: 'marcus.v@ems.corp',
    phone: '+1 (555) 345-6789',
    department: 'Human Resources',
    designation: 'Director of Human Resources',
    joiningDate: new Date('2021-08-01'),
    employmentType: 'full_time',
    salary: 145000,
    address: '890 Pine Blvd, Oakland, CA',
    emergencyContact: { name: 'Sarah Vance', relation: 'Spouse', phone: '+1 (555) 345-0011' },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    skills: ['Talent Strategy', 'Labor Law', 'Executive Coaching', 'Comp & Benefits'],
    manager: 'Anchal Keshri',
    createdAt: new Date('2021-08-01')
  },
  {
    _id: '66e1b0000000000000000003',
    employeeId: 'EMP-003',
    firstName: 'Elena',
    lastName: 'Rostova',
    name: 'Elena Rostova',
    email: 'elena.r@ems.corp',
    phone: '+1 (555) 456-7890',
    department: 'Finance',
    designation: 'Financial Controller',
    joiningDate: new Date('2023-01-10'),
    employmentType: 'full_time',
    salary: 120000,
    address: '12 Montgomery Rd, Berkeley, CA',
    emergencyContact: { name: 'Mikhail Rostov', relation: 'Brother', phone: '+1 (555) 456-1122' },
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'on_leave',
    skills: ['Corporate Tax', 'Auditing', 'Financial Modeling', 'Budgeting'],
    manager: 'Anchal Keshri',
    createdAt: new Date('2023-01-10')
  },
  {
    _id: '66e1b0000000000000000004',
    employeeId: 'EMP-004',
    firstName: 'David',
    lastName: 'Kim',
    name: 'David Kim',
    email: 'david.kim@ems.corp',
    phone: '+1 (555) 567-8901',
    department: 'Product',
    designation: 'Principal Product Manager',
    joiningDate: new Date('2022-11-20'),
    employmentType: 'full_time',
    salary: 140000,
    address: '77 Silicon Way, San Jose, CA',
    emergencyContact: { name: 'Grace Kim', relation: 'Parent', phone: '+1 (555) 567-3344' },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    skills: ['Roadmapping', 'User Research', 'Go-To-Market', 'Agile Delivery'],
    manager: 'Anchal Keshri',
    createdAt: new Date('2022-11-20')
  },
  {
    _id: '66e1b0000000000000000005',
    employeeId: 'EMP-005',
    firstName: 'Amara',
    lastName: 'Okafor',
    name: 'Amara Okafor',
    email: 'amara.o@ems.corp',
    phone: '+1 (555) 678-9012',
    department: 'Engineering',
    designation: 'Staff Infrastructure Engineer',
    joiningDate: new Date('2023-05-18'),
    employmentType: 'full_time',
    salary: 130000,
    address: '320 Mission St, San Francisco, CA',
    emergencyContact: { name: 'Chidi Okafor', relation: 'Spouse', phone: '+1 (555) 678-5566' },
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Security'],
    manager: 'Sophia Chen',
    createdAt: new Date('2023-05-18')
  },
  {
    _id: '66e1b0000000000000000006',
    employeeId: 'EMP-006',
    firstName: 'Liam',
    lastName: 'Gallagher',
    name: 'Liam Gallagher',
    email: 'liam.g@ems.corp',
    phone: '+1 (555) 789-0123',
    department: 'Human Resources',
    designation: 'Senior Talent Partner',
    joiningDate: new Date('2024-01-08'),
    employmentType: 'full_time',
    salary: 95000,
    address: '104 Broadway, Redwood City, CA',
    emergencyContact: { name: 'Noel Gallagher', relation: 'Brother', phone: '+1 (555) 789-6677' },
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    status: 'probation',
    skills: ['Tech Sourcing', 'ATS Management', 'Employer Branding', 'Interviewing'],
    manager: 'Marcus Vance',
    createdAt: new Date('2024-01-08')
  }
];

class DevMemoryEmployeeStore {
  constructor() {
    this.employees = new Map();
    INITIAL_SEED_EMPLOYEES.forEach(emp => {
      this.employees.set(emp.employeeId, { ...emp });
    });
  }

  getAll() {
    return Array.from(this.employees.values());
  }

  findById(id) {
    for (const emp of this.employees.values()) {
      if (emp._id === id || emp.employeeId === id) {
        return emp;
      }
    }
    return null;
  }

  findByEmail(email) {
    const target = email.toLowerCase().trim();
    for (const emp of this.employees.values()) {
      if (emp.email.toLowerCase().trim() === target) {
        return emp;
      }
    }
    return null;
  }

  create(emp) {
    const id = emp.employeeId || `EMP-00${this.employees.size + 1}`;
    const newDoc = {
      _id: `66e1b000000000000000000${this.employees.size + 1}`,
      ...emp,
      employeeId: id,
      name: `${emp.firstName} ${emp.lastName}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.employees.set(id, newDoc);
    return newDoc;
  }

  update(id, updateData) {
    const existing = this.findById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updateData,
      name: `${updateData.firstName || existing.firstName} ${updateData.lastName || existing.lastName}`,
      updatedAt: new Date()
    };
    this.employees.set(existing.employeeId, updated);
    return updated;
  }

  delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;
    this.employees.delete(existing.employeeId);
    return true;
  }
}

const parseSalary = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (val && typeof val === 'object') {
    if (val.base !== undefined) return Number(val.base) || 0;
  }
  return 0;
};

const devEmployeeStore = new DevMemoryEmployeeStore();

/**
 * Sanitizes employee payload to prevent salary data leakage to unauthorized peers
 */
function sanitizeEmployeeResponse(emp, requestingUser) {
  if (!emp) return emp;
  const obj = typeof emp.toObject === 'function' ? emp.toObject() : { ...emp };

  const isAdmin = requestingUser && requestingUser.role === 'admin';
  const isSelf = requestingUser && (
    (requestingUser.email && obj.email && requestingUser.email.toLowerCase() === obj.email.toLowerCase()) ||
    (requestingUser.employeeId && obj.employeeId && requestingUser.employeeId === obj.employeeId)
  );

  // If requesting user is not admin and not viewing their own profile, remove salary
  if (requestingUser && !isAdmin && !isSelf) {
    delete obj.salary;
  }
  return obj;
}

class EmployeeService {
  /**
   * Create new employee record
   */
  async createEmployee(data) {
    const { firstName, lastName, email, phone, department, designation, salary } = data;

    if (!firstName || !lastName || !email || !phone || !department || !designation || salary === undefined) {
      throw ApiError.badRequest('Please provide all mandatory employee fields: firstName, lastName, email, phone, department, designation, salary');
    }

    const isDbConnected = getDbStatus().isConnected;

    // Check duplicate email
    if (isDbConnected) {
      const existingEmail = await Employee.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail) {
        throw ApiError.conflict(`An employee with email '${email}' already exists in the system`);
      }
    } else {
      const existingEmail = devEmployeeStore.findByEmail(email);
      if (existingEmail) {
        throw ApiError.conflict(`An employee with email '${email}' already exists in the system`);
      }
    }

    // Auto-generate employeeId if not provided
    let employeeId = data.employeeId;
    if (!employeeId) {
      const count = isDbConnected ? await Employee.countDocuments() : devEmployeeStore.getAll().length;
      employeeId = `EMP-00${count + 1}`;
    }

    // Check duplicate employeeId
    if (isDbConnected) {
      const existingId = await Employee.findOne({ employeeId });
      if (existingId) {
        employeeId = `EMP-${Date.now().toString().slice(-4)}`;
      }
    }

    const newEmployeeData = {
      ...data,
      employeeId,
      email: email.toLowerCase().trim(),
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
      status: data.status || 'active',
      employmentType: data.employmentType || 'full_time',
      salary: parseSalary(salary),
      avatar: data.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
    };

    let created;
    if (isDbConnected) {
      created = await Employee.create(newEmployeeData);
    } else {
      created = devEmployeeStore.create(newEmployeeData);
    }

    // Event-driven asynchronous notification & welcome email dispatch
    eventDispatcher.employeeCreated(created);

    return created;
  }

  /**
   * Retrieve list of employees with search, filter, sort and pagination
   */
  async getEmployees(params = {}) {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, department, status, employmentType, sortBy = 'createdAt', order = 'desc' } = params;
    const isDbConnected = getDbStatus().isConnected;

    if (isDbConnected) {
      const query = {};

      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { employeeId: searchRegex },
          { designation: searchRegex }
        ];
      }

      if (department && department !== 'All') {
        query.department = department;
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      if (employmentType && employmentType !== 'All') {
        query.employmentType = employmentType;
      }

      const sortOptions = {};
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;

      const [employees, total] = await Promise.all([
        Employee.find(query).sort(sortOptions).skip(skip).limit(limit),
        Employee.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      const sanitized = employees.map(e => sanitizeEmployeeResponse(e, params.requestingUser));

      return {
        employees: sanitized,
        pagination: {
          total,
          totalPages,
          page,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } else {
      // Memory Store Fallback
      let list = devEmployeeStore.getAll();

      if (search) {
        const q = search.toLowerCase().trim();
        list = list.filter(emp =>
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q)
        );
      }

      if (department && department !== 'All') {
        list = list.filter(emp => emp.department === department);
      }

      if (status && status !== 'All') {
        list = list.filter(emp => emp.status === status);
      }

      if (employmentType && employmentType !== 'All') {
        list = list.filter(emp => emp.employmentType === employmentType);
      }

      // Sort
      list.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (typeof valA === 'string') {
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return order === 'asc' ? valA - valB : valB - valA;
      });

      const total = list.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginated = list.slice(skip, skip + limit);
      const sanitized = paginated.map(e => sanitizeEmployeeResponse(e, params.requestingUser));

      return {
        employees: sanitized,
        pagination: {
          total,
          totalPages,
          page,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }
  }

  /**
   * Retrieve single employee by ID or employeeId with linked summaries
   */
  async getEmployeeById(id, options = {}) {
    const isDbConnected = getDbStatus().isConnected;
    let employee;

    if (isDbConnected) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        employee = await Employee.findById(id).populate('user', 'name email role lastLogin');
      } else {
        employee = await Employee.findOne({ employeeId: id }).populate('user', 'name email role lastLogin');
      }
    } else {
      employee = devEmployeeStore.findById(id);
    }

    if (!employee) {
      throw ApiError.notFound(`Employee record not found with id: ${id}`);
    }

    const requestingUser = options.requestingUser;
    const isAdmin = requestingUser && requestingUser.role === 'admin';
    const isSelf = requestingUser && (
      (requestingUser.email && employee.email && requestingUser.email.toLowerCase() === employee.email.toLowerCase()) ||
      (requestingUser.employeeId && employee.employeeId && requestingUser.employeeId === employee.employeeId)
    );

    // Attach contextual 360 summaries for attendance, leaves, and payslips
    const attendanceSummary = {
      presentDays: 21,
      absentDays: 1,
      halfDays: 0,
      shiftsLogged: 22,
      presentRate: 95.5,
      punctualityRate: 91.0,
      recentLogs: [
        { date: '2025-05-15', checkIn: '08:55 AM', checkOut: '05:35 PM', hoursWorked: 8.6, status: 'present' },
        { date: '2025-05-14', checkIn: '09:02 AM', checkOut: '05:15 PM', hoursWorked: 8.2, status: 'present' },
        { date: '2025-05-13', checkIn: '08:50 AM', checkOut: '05:30 PM', hoursWorked: 8.6, status: 'present' }
      ]
    };

    const leaveSummary = {
      annualRemaining: 14,
      sickRemaining: 8,
      casualRemaining: 4,
      totalTakenYearToDate: 5,
      recentApplications: [
        { type: 'Annual Leave', dates: '2025-05-14 to 2025-05-18', days: 5, status: 'approved' },
        { type: 'Casual Leave', dates: '2025-05-22 to 2025-05-23', days: 2, status: 'pending' }
      ]
    };

    // Only expose payslip summary to admin or the employee themselves
    const payslipSummary = (isAdmin || isSelf) && employee.salary !== undefined ? {
      annualBase: employee.salary,
      monthlyGross: Math.round(employee.salary / 12),
      latestDisbursement: {
        period: 'May 2025',
        paymentDate: '2025-05-31',
        netPay: Math.round((employee.salary / 12) * 0.78),
        status: 'processed'
      }
    } : null;

    const sanitizedEmployee = sanitizeEmployeeResponse(employee, requestingUser);

    return {
      ...sanitizedEmployee,
      attendanceSummary,
      leaveSummary,
      payslipSummary
    };
  }

  /**
   * Update existing employee
   */
  async updateEmployee(id, updateData) {
    const isDbConnected = getDbStatus().isConnected;

    // Check duplicate email if changed
    if (updateData.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();
      if (isDbConnected) {
        const emailConflict = await Employee.findOne({
          email: normalizedEmail,
          _id: { $ne: id },
          employeeId: { $ne: id }
        });
        if (emailConflict) {
          throw ApiError.conflict(`Email '${updateData.email}' is already in use by another employee`);
        }
      } else {
        const conflict = devEmployeeStore.findByEmail(normalizedEmail);
        if (conflict && conflict._id !== id && conflict.employeeId !== id) {
          throw ApiError.conflict(`Email '${updateData.email}' is already in use by another employee`);
        }
      }
      updateData.email = normalizedEmail;
    }

    if (updateData.salary !== undefined) {
      updateData.salary = parseSalary(updateData.salary);
    }

    let updated;

    if (isDbConnected) {
      const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { employeeId: id };
      updated = await Employee.findOneAndUpdate(query, updateData, {
        new: true,
        runValidators: true
      });
    } else {
      updated = devEmployeeStore.update(id, updateData);
    }

    if (!updated) {
      throw ApiError.notFound(`Employee not found with id: ${id}`);
    }

    return updated;
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id) {
    const isDbConnected = getDbStatus().isConnected;
    let deleted;

    if (isDbConnected) {
      const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { employeeId: id };
      deleted = await Employee.findOneAndDelete(query);
    } else {
      deleted = devEmployeeStore.delete(id);
    }

    if (!deleted) {
      throw ApiError.notFound(`Employee not found with id: ${id}`);
    }

    return {
      success: true,
      message: 'Employee record deleted successfully'
    };
  }
}

module.exports = new EmployeeService();
