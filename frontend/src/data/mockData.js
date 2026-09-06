export const INITIAL_EMPLOYEES = [
  {
    id: 'EMP-001',
    firstName: 'Sophia',
    lastName: 'Chen',
    name: 'Sophia Chen',
    email: 'sophia.chen@ems.corp',
    phone: '+1 (555) 234-5678',
    role: 'Staff Software Engineer',
    designation: 'Staff Software Engineer',
    department: 'Engineering',
    status: 'active',
    joiningDate: '2022-03-15',
    salary: 135000,
    address: '452 Market Street, San Francisco, CA',
    emergencyContact: { name: 'David Chen', relation: 'Spouse', phone: '+1 (555) 234-9988' },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skills: ['React', 'Node.js', 'System Architecture', 'TypeScript', 'MongoDB'],
    manager: 'Marcus Vance'
  },
  {
    id: 'EMP-002',
    firstName: 'Marcus',
    lastName: 'Vance',
    name: 'Marcus Vance',
    email: 'marcus.v@ems.corp',
    phone: '+1 (555) 345-6789',
    role: 'Director of HR',
    designation: 'Director of Human Resources',
    department: 'Human Resources',
    status: 'active',
    joiningDate: '2021-08-01',
    salary: 145000,
    address: '890 Pine Blvd, Oakland, CA',
    emergencyContact: { name: 'Sarah Vance', relation: 'Spouse', phone: '+1 (555) 345-0011' },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skills: ['Talent Strategy', 'Labor Law', 'Executive Coaching', 'Comp & Benefits'],
    manager: 'Anchal Keshri'
  },
  {
    id: 'EMP-003',
    firstName: 'Elena',
    lastName: 'Rostova',
    name: 'Elena Rostova',
    email: 'elena.r@ems.corp',
    phone: '+1 (555) 456-7890',
    role: 'Financial Controller',
    designation: 'Financial Controller',
    department: 'Finance',
    status: 'on_leave',
    joiningDate: '2023-01-10',
    salary: 120000,
    address: '12 Montgomery Rd, Berkeley, CA',
    emergencyContact: { name: 'Mikhail Rostov', relation: 'Brother', phone: '+1 (555) 456-1122' },
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    skills: ['Corporate Tax', 'Auditing', 'Financial Modeling', 'Budgeting'],
    manager: 'Anchal Keshri'
  },
  {
    id: 'EMP-004',
    firstName: 'David',
    lastName: 'Kim',
    name: 'David Kim',
    email: 'david.kim@ems.corp',
    phone: '+1 (555) 567-8901',
    role: 'Principal Product Manager',
    designation: 'Principal Product Manager',
    department: 'Product',
    status: 'active',
    joiningDate: '2022-11-20',
    salary: 140000,
    address: '77 Silicon Way, San Jose, CA',
    emergencyContact: { name: 'Grace Kim', relation: 'Parent', phone: '+1 (555) 567-3344' },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    skills: ['Roadmapping', 'User Research', 'Go-To-Market', 'Agile Delivery'],
    manager: 'Anchal Keshri'
  },
  {
    id: 'EMP-005',
    firstName: 'Amara',
    lastName: 'Okafor',
    name: 'Amara Okafor',
    email: 'amara.o@ems.corp',
    phone: '+1 (555) 678-9012',
    role: 'DevOps Lead',
    designation: 'Staff Infrastructure Engineer',
    department: 'Engineering',
    status: 'active',
    joiningDate: '2023-05-18',
    salary: 130000,
    address: '320 Mission St, San Francisco, CA',
    emergencyContact: { name: 'Chidi Okafor', relation: 'Spouse', phone: '+1 (555) 678-5566' },
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Security'],
    manager: 'Sophia Chen'
  },
  {
    id: 'EMP-006',
    firstName: 'Liam',
    lastName: 'Gallagher',
    name: 'Liam Gallagher',
    email: 'liam.g@ems.corp',
    phone: '+1 (555) 789-0123',
    role: 'Talent Acquisition Lead',
    designation: 'Senior Talent Partner',
    department: 'Human Resources',
    status: 'probation',
    joiningDate: '2024-01-08',
    salary: 95000,
    address: '104 Broadway, Redwood City, CA',
    emergencyContact: { name: 'Noel Gallagher', relation: 'Brother', phone: '+1 (555) 789-6677' },
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    skills: ['Tech Sourcing', 'ATS Management', 'Employer Branding', 'Interviewing'],
    manager: 'Marcus Vance'
  },
  {
    id: 'EMP-007',
    firstName: 'Priya',
    lastName: 'Nair',
    name: 'Priya Nair',
    email: 'priya.nair@ems.corp',
    phone: '+1 (555) 890-1234',
    role: 'Senior UX Architect',
    designation: 'Senior Product Designer',
    department: 'Product',
    status: 'active',
    joiningDate: '2023-08-14',
    salary: 115000,
    address: '22 Elm Street, Palo Alto, CA',
    emergencyContact: { name: 'Rohan Nair', relation: 'Spouse', phone: '+1 (555) 890-9988' },
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    skills: ['Design Systems', 'Figma', 'Usability Testing', 'Prototyping'],
    manager: 'David Kim'
  },
  {
    id: 'EMP-008',
    firstName: 'Carlos',
    lastName: 'Mendez',
    name: 'Carlos Mendez',
    email: 'carlos.m@ems.corp',
    phone: '+1 (555) 901-2345',
    role: 'Legal Counsel',
    designation: 'Senior Corporate Counsel',
    department: 'Legal',
    status: 'active',
    joiningDate: '2022-06-01',
    salary: 138000,
    address: '55 California St, San Francisco, CA',
    emergencyContact: { name: 'Isabella Mendez', relation: 'Spouse', phone: '+1 (555) 901-4455' },
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    skills: ['Employment Law', 'Vendor Contracts', 'IP Governance', 'Compliance'],
    manager: 'Anchal Keshri'
  }
];

export const INITIAL_ATTENDANCE = [
  { id: 'ATT-101', employeeId: 'EMP-001', employeeName: 'Sophia Chen', date: '2025-05-15', checkIn: '08:55 AM', checkOut: '05:35 PM', status: 'present', hoursWorked: 8.6, department: 'Engineering' },
  { id: 'ATT-102', employeeId: 'EMP-002', employeeName: 'Marcus Vance', date: '2025-05-15', checkIn: '09:02 AM', checkOut: '05:15 PM', status: 'present', hoursWorked: 8.2, department: 'Human Resources' },
  { id: 'ATT-103', employeeId: 'EMP-003', employeeName: 'Elena Rostova', date: '2025-05-15', checkIn: '--', checkOut: '--', status: 'on_leave', hoursWorked: 0, department: 'Finance' },
  { id: 'ATT-104', employeeId: 'EMP-004', employeeName: 'David Kim', date: '2025-05-15', checkIn: '09:30 AM', checkOut: '06:00 PM', status: 'late', hoursWorked: 8.5, department: 'Product' },
  { id: 'ATT-105', employeeId: 'EMP-005', employeeName: 'Amara Okafor', date: '2025-05-15', checkIn: '08:45 AM', checkOut: '05:00 PM', status: 'present', hoursWorked: 8.25, department: 'Engineering' },
  { id: 'ATT-106', employeeId: 'EMP-006', employeeName: 'Liam Gallagher', date: '2025-05-15', checkIn: '09:10 AM', checkOut: '01:10 PM', status: 'half_day', hoursWorked: 4.0, department: 'Human Resources' },
  { id: 'ATT-107', employeeId: 'EMP-007', employeeName: 'Priya Nair', date: '2025-05-15', checkIn: '08:50 AM', checkOut: '05:20 PM', status: 'present', hoursWorked: 8.5, department: 'Product' },
  { id: 'ATT-108', employeeId: 'EMP-008', employeeName: 'Carlos Mendez', date: '2025-05-15', checkIn: '09:05 AM', checkOut: '05:30 PM', status: 'present', hoursWorked: 8.4, department: 'Legal' }
];

export const INITIAL_LEAVES = [
  {
    id: 'LV-501',
    employeeId: 'EMP-003',
    employeeName: 'Elena Rostova',
    department: 'Finance',
    leaveType: 'Annual Leave',
    startDate: '2025-05-14',
    endDate: '2025-05-18',
    totalDays: 5,
    reason: 'Family reunion and annual vacation',
    status: 'approved',
    appliedOn: '2025-05-02',
    approvedBy: 'Marcus Vance'
  },
  {
    id: 'LV-502',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    leaveType: 'Casual Leave',
    startDate: '2025-05-22',
    endDate: '2025-05-23',
    totalDays: 2,
    reason: 'Personal appointments and domestic relocation',
    status: 'pending',
    appliedOn: '2025-05-12',
    approvedBy: null
  },
  {
    id: 'LV-503',
    employeeId: 'EMP-004',
    employeeName: 'David Kim',
    department: 'Product',
    leaveType: 'Sick Leave',
    startDate: '2025-05-10',
    endDate: '2025-05-11',
    totalDays: 2,
    reason: 'Severe viral flu and doctor recommended bed rest',
    status: 'approved',
    appliedOn: '2025-05-09',
    approvedBy: 'Marcus Vance'
  },
  {
    id: 'LV-504',
    employeeId: 'EMP-006',
    employeeName: 'Liam Gallagher',
    department: 'Human Resources',
    leaveType: 'Casual Leave',
    startDate: '2025-05-28',
    endDate: '2025-05-29',
    totalDays: 2,
    reason: 'Attending regional HR summit in Chicago',
    status: 'pending',
    appliedOn: '2025-05-14',
    approvedBy: null
  },
  {
    id: 'LV-505',
    employeeId: 'EMP-005',
    employeeName: 'Amara Okafor',
    department: 'Engineering',
    leaveType: 'Paternity Leave',
    startDate: '2025-06-01',
    endDate: '2025-06-14',
    totalDays: 10,
    reason: 'Newborn child care and parental duties',
    status: 'approved',
    appliedOn: '2025-05-01',
    approvedBy: 'Marcus Vance'
  }
];

export const INITIAL_PAYSLIPS = [
  {
    id: 'PAY-2025-05-001',
    employeeId: 'EMP-001',
    employeeName: 'Sophia Chen',
    department: 'Engineering',
    designation: 'Staff Software Engineer',
    period: 'May 2025',
    month: 'May',
    year: '2025',
    paymentDate: '2025-05-31',
    status: 'processed',
    bankAccount: '•••• •••• •••• 4892 (Chase Bank)',
    earnings: {
      basic: 6500,
      hra: 2200,
      specialAllowance: 1800,
      performanceBonus: 750
    },
    deductions: {
      providentFund: 780,
      professionalTax: 200,
      taxDeductedAtSource: 1250,
      healthInsurance: 150
    },
    grossPay: 11250,
    totalDeductions: 2380,
    netPay: 8870
  },
  {
    id: 'PAY-2025-05-002',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Vance',
    department: 'Human Resources',
    designation: 'Director of Human Resources',
    period: 'May 2025',
    month: 'May',
    year: '2025',
    paymentDate: '2025-05-31',
    status: 'processed',
    bankAccount: '•••• •••• •••• 9921 (Wells Fargo)',
    earnings: {
      basic: 7200,
      hra: 2500,
      specialAllowance: 1600,
      performanceBonus: 800
    },
    deductions: {
      providentFund: 864,
      professionalTax: 200,
      taxDeductedAtSource: 1450,
      healthInsurance: 150
    },
    grossPay: 12100,
    totalDeductions: 2664,
    netPay: 9436
  },
  {
    id: 'PAY-2025-05-003',
    employeeId: 'EMP-003',
    employeeName: 'Elena Rostova',
    department: 'Finance',
    designation: 'Financial Controller',
    period: 'May 2025',
    month: 'May',
    year: '2025',
    paymentDate: '2025-05-31',
    status: 'processed',
    bankAccount: '•••• •••• •••• 3341 (Bank of America)',
    earnings: {
      basic: 5800,
      hra: 2000,
      specialAllowance: 1400,
      performanceBonus: 800
    },
    deductions: {
      providentFund: 696,
      professionalTax: 200,
      taxDeductedAtSource: 1100,
      healthInsurance: 150
    },
    grossPay: 10000,
    totalDeductions: 2146,
    netPay: 7854
  },
  {
    id: 'PAY-2025-05-004',
    employeeId: 'EMP-004',
    employeeName: 'David Kim',
    department: 'Product',
    designation: 'Principal Product Manager',
    period: 'May 2025',
    month: 'May',
    year: '2025',
    paymentDate: '2025-05-31',
    status: 'pending',
    bankAccount: '•••• •••• •••• 7120 (Citi)',
    earnings: {
      basic: 6800,
      hra: 2400,
      specialAllowance: 1700,
      performanceBonus: 750
    },
    deductions: {
      providentFund: 816,
      professionalTax: 200,
      taxDeductedAtSource: 1350,
      healthInsurance: 150
    },
    grossPay: 11650,
    totalDeductions: 2516,
    netPay: 9134
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-01',
    title: 'New Leave Application',
    message: 'Sophia Chen submitted a Casual Leave request for May 22 - May 23.',
    time: '15 mins ago',
    type: 'leave',
    read: false,
    link: '/leaves'
  },
  {
    id: 'NOTIF-02',
    title: 'Monthly Payroll Batch Ready',
    message: 'May 2025 payroll calculations finalized. 148 payslips queued for approval.',
    time: '1 hour ago',
    type: 'payroll',
    read: false,
    link: '/payroll'
  },
  {
    id: 'NOTIF-03',
    title: 'System Health Check Alert',
    message: 'Automated health telemetry probe completed successfully. API response 200 OK.',
    time: '3 hours ago',
    type: 'system',
    read: true,
    link: '/system-health'
  },
  {
    id: 'NOTIF-04',
    title: 'New Employee Profile Created',
    message: 'Liam Gallagher successfully completed HR onboarding in Human Resources.',
    time: 'Yesterday',
    type: 'employee',
    read: true,
    link: '/employees/EMP-006'
  },
  {
    id: 'NOTIF-05',
    title: 'Upcoming Company Holiday',
    message: 'Memorial Day observance on Monday, May 26. Corporate offices will remain closed.',
    time: '2 days ago',
    type: 'company',
    read: true,
    link: '/'
  }
];

export const ATTENDANCE_CHART_DATA = [
  { day: 'Mon (05/12)', presentRate: 95, present: 141, absent: 7, late: 4 },
  { day: 'Tue (05/13)', presentRate: 94, present: 139, absent: 9, late: 6 },
  { day: 'Wed (05/14)', presentRate: 97, present: 144, absent: 4, late: 3 },
  { day: 'Thu (05/15)', presentRate: 93, present: 137, absent: 11, late: 5 },
  { day: 'Fri (05/16)', presentRate: 91, present: 135, absent: 13, late: 8 }
];

export const DEPARTMENT_CHART_DATA = [
  { name: 'Engineering', count: 54, color: '#4f46e5' },
  { name: 'Product & Design', count: 28, color: '#06b6d4' },
  { name: 'Human Resources', count: 18, color: '#10b981' },
  { name: 'Finance & Legal', count: 22, color: '#f59e0b' },
  { name: 'Marketing & Sales', count: 26, color: '#8b5cf6' }
];

export const LEAVE_STATUS_CHART_DATA = [
  { month: 'Jan', annual: 18, sick: 12, casual: 6 },
  { month: 'Feb', annual: 12, sick: 15, casual: 8 },
  { month: 'Mar', annual: 24, sick: 9, casual: 11 },
  { month: 'Apr', annual: 21, sick: 14, casual: 9 },
  { month: 'May', annual: 29, sick: 10, casual: 14 }
];

export const UPCOMING_HOLIDAYS = [
  { name: 'Memorial Day', date: 'Monday, May 26, 2025', daysAway: '11 days away', type: 'Federal Holiday' },
  { name: 'Juneteenth National Independence Day', date: 'Thursday, Jun 19, 2025', daysAway: '35 days away', type: 'Federal Holiday' },
  { name: 'Independence Day', date: 'Friday, Jul 4, 2025', daysAway: '50 days away', type: 'Federal Holiday' },
  { name: 'Labor Day', date: 'Monday, Sep 1, 2025', daysAway: '108 days away', type: 'Federal Holiday' }
];

export const EMPLOYEE_LEAVE_BALANCE = {
  annual: { total: 20, used: 6, remaining: 14 },
  sick: { total: 10, used: 2, remaining: 8 },
  casual: { total: 7, used: 3, remaining: 4 },
  floater: { total: 3, used: 1, remaining: 2 }
};
