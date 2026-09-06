import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_PAYSLIPS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { notificationService } from '../services/notificationService';
import { leaveService } from '../services/leaveService';

const EMSDataContext = createContext(null);

export const EMSDataProvider = ({ children }) => {
  // Employees State
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('ems_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Sync employees from backend on mount
  const refreshEmployees = useCallback(async () => {
    try {
      setIsLoadingEmployees(true);
      const res = await employeeService.getEmployees({ limit: 100 });
      if (res.employees && res.employees.length > 0) {
        const formatted = res.employees.map(emp => ({
          ...emp,
          id: emp.employeeId || emp._id,
          name: emp.name || `${emp.firstName} ${emp.lastName}`
        }));
        setEmployees(formatted);
      }
    } catch (err) {
      console.warn('Backend employees fetch fallback to local cache:', err.message);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    refreshEmployees();
  }, [refreshEmployees]);

  // Attendance State
  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem('ems_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  // Leaves State
  const [leaves, setLeaves] = useState(() => {
    const saved = localStorage.getItem('ems_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVES;
  });

  // Payslips State
  const [payslips, setPayslips] = useState(() => {
    const saved = localStorage.getItem('ems_payslips');
    return saved ? JSON.parse(saved) : INITIAL_PAYSLIPS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('ems_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Employee clocked-in state
  const [isClockedIn, setIsClockedIn] = useState(() => {
    return localStorage.getItem('ems_clocked_in') === 'true';
  });
  const [clockInTime, setClockInTime] = useState(() => {
    return localStorage.getItem('ems_clock_in_time') || null;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ems_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('ems_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('ems_leaves', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('ems_payslips', JSON.stringify(payslips));
  }, [payslips]);

  useEffect(() => {
    localStorage.setItem('ems_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Employee CRUD operations
  const addEmployee = async (newEmployeeData) => {
    try {
      const backendEmp = await employeeService.createEmployee({
        ...newEmployeeData,
        salary: Number(newEmployeeData.salary) || 0
      });
      const formatted = {
        ...backendEmp,
        id: backendEmp.employeeId || backendEmp._id,
        name: backendEmp.name || `${backendEmp.firstName} ${backendEmp.lastName}`
      };
      setEmployees(prev => [formatted, ...prev.filter(e => e.id !== formatted.id)]);

      addNotification({
        title: 'New Employee Added',
        message: `${formatted.name} was registered into ${formatted.department}.`,
        type: 'employee',
        link: `/employees/${formatted.id}`
      });
      return formatted;
    } catch (err) {
      // Graceful local fallback if offline
      const id = `EMP-00${employees.length + 1}`;
      const newEmp = {
        id,
        name: `${newEmployeeData.firstName} ${newEmployeeData.lastName}`,
        ...newEmployeeData,
        status: newEmployeeData.status || 'active',
        joiningDate: newEmployeeData.joiningDate || new Date().toISOString().split('T')[0],
        avatar: newEmployeeData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      };
      setEmployees(prev => [newEmp, ...prev]);

      addNotification({
        title: 'New Employee Added',
        message: `${newEmp.name} was registered into ${newEmp.department}.`,
        type: 'employee',
        link: `/employees/${newEmp.id}`
      });
      return newEmp;
    }
  };

  const updateEmployee = async (id, updatedData) => {
    try {
      const backendUpdated = await employeeService.updateEmployee(id, {
        ...updatedData,
        salary: updatedData.salary !== undefined ? Number(updatedData.salary) : undefined
      });
      const formatted = {
        ...backendUpdated,
        id: backendUpdated.employeeId || backendUpdated._id,
        name: backendUpdated.name || `${backendUpdated.firstName} ${backendUpdated.lastName}`
      };
      setEmployees(prev => prev.map(emp => (emp.id === id || emp._id === id ? formatted : emp)));
      return formatted;
    } catch (err) {
      setEmployees(prev =>
        prev.map(emp => (emp.id === id ? { ...emp, ...updatedData, name: `${updatedData.firstName || emp.firstName} ${updatedData.lastName || emp.lastName}` } : emp))
      );
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await employeeService.deleteEmployee(id);
    } catch (err) {
      console.warn('Backend delete employee error, falling back locally:', err.message);
    }
    setEmployees(prev => prev.filter(emp => emp.id !== id && emp._id !== id && emp.employeeId !== id));
  };

  const getEmployeeById = (id) => {
    return employees.find(emp => emp.id === id || emp._id === id || emp.employeeId === id);
  };

  // Leave operations
  const applyLeave = (leaveData) => {
    const newLeave = {
      id: `LV-${Math.floor(100 + Math.random() * 900)}`,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
      approvedBy: null,
      ...leaveData
    };
    setLeaves(prev => [newLeave, ...prev]);

    addNotification({
      title: 'New Leave Submitted',
      message: `${newLeave.employeeName} submitted a ${newLeave.leaveType} request.`,
      type: 'leave',
      link: '/leaves'
    });

    return newLeave;
  };

  const updateLeaveStatus = (leaveId, status, approverName = 'Anchal Keshri') => {
    setLeaves(prev =>
      prev.map(lv =>
        lv.id === leaveId
          ? { ...lv, status, approvedBy: status === 'approved' ? approverName : null }
          : lv
      )
    );

    const leave = leaves.find(l => l.id === leaveId);
    if (leave) {
      addNotification({
        title: `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Leave request for ${leave.employeeName} (${leave.leaveType}) was marked as ${status}.`,
        type: 'leave',
        link: '/leaves'
      });
    }
  };

  // Sync today's attendance status from backend
  useEffect(() => {
    const checkTodayPunch = async () => {
      try {
        const todayRes = await attendanceService.getTodayStatus();
        setIsClockedIn(todayRes.isClockedIn);
        if (todayRes.clockInTime) {
          const t = new Date(todayRes.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setClockInTime(t);
        } else {
          setClockInTime(null);
        }
      } catch (err) {
        // Fallback to local storage state
      }
    };
    checkTodayPunch();
  }, []);

  // Attendance operations
  const toggleClock = async () => {
    if (!isClockedIn) {
      try {
        const res = await attendanceService.checkIn();
        const now = res.checkIn ? new Date(res.checkIn) : new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setIsClockedIn(true);
        setClockInTime(timeStr);
        localStorage.setItem('ems_clocked_in', 'true');
        localStorage.setItem('ems_clock_in_time', timeStr);
      } catch (err) {
        console.warn('Clock-in backend error, falling back locally:', err.message);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setIsClockedIn(true);
        setClockInTime(timeStr);
        localStorage.setItem('ems_clocked_in', 'true');
        localStorage.setItem('ems_clock_in_time', timeStr);
      }
    } else {
      try {
        await attendanceService.checkOut();
        setIsClockedIn(false);
        localStorage.setItem('ems_clocked_in', 'false');
        localStorage.removeItem('ems_clock_in_time');
      } catch (err) {
        console.warn('Clock-out backend error, falling back locally:', err.message);
        setIsClockedIn(false);
        localStorage.setItem('ems_clocked_in', 'false');
        localStorage.removeItem('ems_clock_in_time');
      }
    }
  };

  // Sync notifications from backend
  const refreshNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res.notifications && res.notifications.length > 0) {
        const formatted = res.notifications.map(n => ({
          ...n,
          id: n._id || n.id,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          read: n.isRead ?? n.read ?? false
        }));
        setNotifications(prev => {
          // Merge with unique IDs
          const existingMap = new Map();
          formatted.forEach(item => existingMap.set(item.id, item));
          prev.forEach(item => {
            if (!existingMap.has(item.id)) existingMap.set(item.id, item);
          });
          return Array.from(existingMap.values());
        });
      }
    } catch (err) {
      // Keep local notifications
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Notification operations
  const addNotification = (notif) => {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      time: 'Just now',
      read: false,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id || n._id === id ? { ...n, read: true, isRead: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      // Handled locally
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      // Handled locally
    }
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
  };

  return (
    <EMSDataContext.Provider
      value={{
        employees,
        isLoadingEmployees,
        refreshEmployees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployeeById,
        attendance,
        toggleClock,
        isClockedIn,
        clockInTime,
        leaves,
        applyLeave,
        updateLeaveStatus,
        payslips,
        notifications,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification
      }}
    >
      {children}
    </EMSDataContext.Provider>
  );
};

export const useEMSData = () => {
  const context = useContext(EMSDataContext);
  if (!context) {
    throw new Error('useEMSData must be used within an EMSDataProvider');
  }
  return context;
};
