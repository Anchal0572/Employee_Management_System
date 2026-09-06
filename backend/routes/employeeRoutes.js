const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All employee routes require authentication
router.use(protect);

router
  .route('/')
  .get(employeeController.getEmployees)
  .post(authorize('admin'), employeeController.createEmployee);

router
  .route('/:id')
  .get(employeeController.getEmployeeById)
  .put(authorize('admin'), employeeController.updateEmployee)
  .delete(authorize('admin'), employeeController.deleteEmployee);

module.exports = router;
