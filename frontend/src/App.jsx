import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EMSDataProvider } from './context/EMSDataContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute, RoleRoute } from './components/common/ProtectedRoute';

// 16 Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { Employees } from './pages/Employees';
import { EmployeeDetails } from './pages/EmployeeDetails';
import { AddEmployee } from './pages/AddEmployee';
import { EditEmployee } from './pages/EditEmployee';
import { Attendance } from './pages/Attendance';
import { LeaveManagement } from './pages/LeaveManagement';
import { Payslips } from './pages/Payslips';
import { PayslipDetails } from './pages/PayslipDetails';
import { PrintablePayslip } from './pages/PrintablePayslip';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { SystemHealth } from './pages/SystemHealth';
import { AIAssistant } from './pages/AIAssistant';
import { NotFound } from './pages/NotFound';

/**
 * Dynamic Dashboard Selector: Automatically shows Admin or Employee Dashboard based on active role
 */
const DynamicDashboard = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Standalone Full-Page Printable Payslip */}
      <Route
        path="/payroll/:id/print"
        element={
          <ProtectedRoute>
            <PrintablePayslip />
          </ProtectedRoute>
        }
      />

      {/* Main SaaS Application Shell (Protected) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Role Dashboard */}
        <Route index element={<DynamicDashboard />} />
        <Route
          path="admin/dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route path="employee/dashboard" element={<EmployeeDashboard />} />

        {/* Employees Module */}
        <Route path="employees" element={<Employees />} />
        <Route
          path="employees/new"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AddEmployee />
            </RoleRoute>
          }
        />
        <Route path="employees/:id" element={<EmployeeDetails />} />
        <Route
          path="employees/:id/edit"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <EditEmployee />
            </RoleRoute>
          }
        />

        {/* Attendance Module */}
        <Route path="attendance" element={<Attendance />} />

        {/* Leave Management Module */}
        <Route path="leaves" element={<LeaveManagement />} />

        {/* Payroll & Payslips Module */}
        <Route path="payroll" element={<Payslips />} />
        <Route path="payroll/:id" element={<PayslipDetails />} />

        {/* Analytics & Reports (Admin only) */}
        <Route
          path="analytics"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />

        {/* AI Policy & HR Assistant */}
        <Route path="ai-assistant" element={<AIAssistant />} />

        {/* Notifications Center */}
        <Route path="notifications" element={<Notifications />} />

        {/* User Profile */}
        <Route path="profile" element={<Profile />} />

        {/* System Diagnostics & Health Check */}
        <Route path="system-health" element={<SystemHealth />} />

        {/* System Settings (Admin only) */}
        <Route
          path="settings"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Settings />
            </RoleRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <EMSDataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </EMSDataProvider>
    </AuthProvider>
  );
}

export default App;
