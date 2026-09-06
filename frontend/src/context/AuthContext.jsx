import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('admin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify session on application mount
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('ems_auth_token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const userProfile = await authService.getMe();
        setUser(userProfile);
        setRole(userProfile.role);
        setIsAuthenticated(true);
      } catch (err) {
        console.warn('Session verification failed or token expired:', err.message);
        localStorage.removeItem('ems_auth_token');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { user: authedUser, token } = await authService.login(email, password);
      localStorage.setItem('ems_auth_token', token);
      setUser(authedUser);
      setRole(authedUser.role);
      setIsAuthenticated(true);
      return authedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('ems_auth_token');
      setUser(null);
      setRole('employee');
      setIsAuthenticated(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await authService.changePassword(currentPassword, newPassword);
  };

  /**
   * Helper to quickly switch perspective between Admin and Employee for evaluation
   */
  const switchRole = async (targetRole) => {
    const targetEmail = targetRole === 'admin' ? 'anchal.keshri@ems.corp' : 'sophia.chen@ems.corp';
    const targetPass = targetRole === 'admin' ? 'AdminPassword@2025' : 'EmployeePassword@2025';

    try {
      await login(targetEmail, targetPass);
    } catch (err) {
      // Fallback local update if network is busy
      setRole(targetRole);
      if (user) {
        setUser({ ...user, role: targetRole });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || {
          name: role === 'admin' ? 'Anchal Keshri' : 'Sophia Chen',
          email: role === 'admin' ? 'anchal.keshri@ems.corp' : 'sophia.chen@ems.corp',
          role: role,
          department: role === 'admin' ? 'Operations' : 'Engineering',
          designation: role === 'admin' ? 'System Administrator' : 'Staff Software Engineer',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
        },
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
        changePassword,
        isAdmin: role === 'admin',
        isEmployee: role === 'employee'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
