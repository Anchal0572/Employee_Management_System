const payslipService = require('../services/payslipService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * POST /api/payroll — Admin: Generate a new payslip
 */
exports.generatePayslip = async (req, res, next) => {
  try {
    const {
      employeeId,
      employeeName,
      department,
      designation,
      bankAccount,
      salaryMonth,
      basicSalary,
      bonus,
      allowances: allowancesOverride,
      deductions: deductionsOverride,
      taxOverride,
      notes
    } = req.body;

    const payslip = await payslipService.generatePayslip({
      employeeId,
      employeeName,
      department,
      designation,
      bankAccount,
      salaryMonth,
      basicSalary: Number(basicSalary),
      bonus: Number(bonus) || 0,
      allowancesOverride: allowancesOverride || {},
      deductionsOverride: deductionsOverride || {},
      taxOverride: taxOverride !== undefined ? Number(taxOverride) : undefined,
      notes: notes || '',
      generatedBy: req.user.id,
      generatedByName: req.user.name
    });

    return ApiResponse.created(res, 'Payslip generated successfully', payslip);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payroll — Admin: List all payslips with filters
 */
exports.getAdminPayslips = async (req, res, next) => {
  try {
    const { salaryMonth, employeeId, paymentStatus, page, limit } = req.query;
    const result = await payslipService.getAdminPayslips({
      salaryMonth,
      employeeId,
      paymentStatus,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });
    return ApiResponse.paginated(res, 'Payslips retrieved', result.payslips, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payroll/my-payslips — Employee: View own payslips
 */
exports.getMyPayslips = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    const { salaryMonth, page, limit } = req.query;

    if (!employeeId) {
      return next(ApiError.badRequest('No employeeId associated with your account'));
    }

    const result = await payslipService.getMyPayslips({
      employeeId,
      salaryMonth,
      page: Number(page) || 1,
      limit: Number(limit) || 12
    });

    return ApiResponse.paginated(res, 'Your payslips retrieved', result.payslips, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payroll/summary — Admin: Payroll metrics
 */
exports.getPayrollSummary = async (req, res, next) => {
  try {
    const { salaryMonth } = req.query;
    const summary = await payslipService.getPayrollSummary({ salaryMonth });
    return ApiResponse.success(res, 'Payroll summary retrieved', summary);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payroll/preview — Admin: Preview salary calculation without saving
 */
exports.previewCalculation = async (req, res, next) => {
  try {
    const { basicSalary, bonus, allowances, deductions, taxOverride } = req.query;
    const preview = payslipService.previewCalculation({
      basicSalary: Number(basicSalary),
      bonus: Number(bonus) || 0,
      allowancesOverride: allowances ? JSON.parse(allowances) : {},
      deductionsOverride: deductions ? JSON.parse(deductions) : {},
      taxOverride: taxOverride !== undefined ? Number(taxOverride) : undefined
    });
    return ApiResponse.success(res, 'Salary calculation preview', preview);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payroll/:id — Get single payslip (admin: any, employee: own only)
 */
exports.getPayslipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const requestingEmployeeId = req.user.employeeId;

    const payslip = await payslipService.getPayslipById(id, { requestingEmployeeId, isAdmin });
    return ApiResponse.success(res, 'Payslip retrieved', payslip);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/payroll/:id/status — Admin: Update payment status
 */
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentDate, notes } = req.body;

    if (!paymentStatus) {
      return next(ApiError.badRequest('paymentStatus is required'));
    }

    const payslip = await payslipService.updatePaymentStatus(id, {
      paymentStatus,
      paymentDate,
      notes,
      updatedByName: req.user.name
    });

    return ApiResponse.success(res, `Payment status updated to ${paymentStatus}`, payslip);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/payroll/:id — Admin: Delete a payslip (Draft only)
 */
exports.deletePayslip = async (req, res, next) => {
  try {
    const result = await payslipService.deletePayslip(req.params.id);
    return ApiResponse.success(res, 'Payslip deleted successfully', result);
  } catch (err) {
    next(err);
  }
};
