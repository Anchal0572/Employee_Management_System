const express = require('express');
const payslipController = require('../controllers/payslipController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All payroll endpoints require authentication
router.use(protect);

// ── Employee Routes ──────────────────────────────────────────────────────────
// Must come before /:id to avoid route conflicts
router.get('/my-payslips', payslipController.getMyPayslips);

// ── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/summary', authorize('admin'), payslipController.getPayrollSummary);
router.get('/preview', authorize('admin'), payslipController.previewCalculation);
router.post('/', authorize('admin'), payslipController.generatePayslip);
router.get('/', authorize('admin'), payslipController.getAdminPayslips);

// ── Shared Routes (auth enforced, ownership enforced in service) ─────────────
router.get('/:id', payslipController.getPayslipById);
router.put('/:id/status', authorize('admin'), payslipController.updatePaymentStatus);
router.delete('/:id', authorize('admin'), payslipController.deletePayslip);

module.exports = router;
