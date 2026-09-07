const express = require('express');
const expenseController = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.submitExpense);
router.put('/:id/review', authorize('admin'), expenseController.reviewExpense);

module.exports = router;
