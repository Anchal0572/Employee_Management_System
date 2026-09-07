const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const leaveRoutes = require('./leaveRoutes');
const notificationRoutes = require('./notificationRoutes');
const payrollRoutes = require('./payrollRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const aiRoutes = require('./aiRoutes');
const documentRoutes = require('./documentRoutes');
const expenseRoutes = require('./expenseRoutes');
const announcementRoutes = require('./announcementRoutes');
const performanceRoutes = require('./performanceRoutes');

const router = express.Router();

// Mount API route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payroll', payrollRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ai', aiRoutes);
router.use('/documents', documentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/announcements', announcementRoutes);
router.use('/performance', performanceRoutes);

module.exports = router;
