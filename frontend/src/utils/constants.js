export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { name: 'Employees', href: '/employees', icon: 'Users' },
  { name: 'Departments', href: '/departments', icon: 'Building2' },
  { name: 'Attendance', href: '/attendance', icon: 'Clock' },
  { name: 'Leaves', href: '/leaves', icon: 'CalendarDays' },
  { name: 'Payroll', href: '/payroll', icon: 'CreditCard' },
  { name: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { name: 'System Diagnostics', href: '/system-health', icon: 'Activity' },
  { name: 'Settings', href: '/settings', icon: 'Settings' }
];

export const SYSTEM_INFO = {
  appName: 'WorkPulse',
  version: 'v2.0.0',
  environment: import.meta.env.MODE || 'development'
};
