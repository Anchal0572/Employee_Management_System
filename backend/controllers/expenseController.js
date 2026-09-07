const expenseService = require('../services/expenseService');
const asyncHandler = require('../utils/asyncHandler');

class ExpenseController {
  getExpenses = asyncHandler(async (req, res) => {
    const { status, category } = req.query;
    const result = await expenseService.getExpenses({
      user: req.user,
      status,
      category
    });

    res.status(200).json({
      success: true,
      data: result.expenses,
      metrics: result.metrics
    });
  });

  submitExpense = asyncHandler(async (req, res) => {
    const expense = await expenseService.submitExpense(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Expense claim submitted successfully for review',
      data: expense
    });
  });

  reviewExpense = asyncHandler(async (req, res) => {
    const expense = await expenseService.reviewExpense(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: `Expense claim marked as ${req.body.status}`,
      data: expense
    });
  });
}

module.exports = new ExpenseController();
