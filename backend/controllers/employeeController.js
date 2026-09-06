const employeeService = require('../services/employeeService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class EmployeeController {
  /**
   * Create a new employee record
   * POST /api/employees
   * Accessible by: Admin only
   */
  createEmployee = asyncHandler(async (req, res) => {
    const employee = await employeeService.createEmployee(req.body);

    return ApiResponse.success(
      res,
      'Employee created successfully',
      employee,
      201
    );
  });

  /**
   * Retrieve list of employees with search, filter, sort & pagination
   * GET /api/employees
   * Accessible by: Authenticated users
   */
  getEmployees = asyncHandler(async (req, res) => {
    const {
      page,
      limit,
      search,
      department,
      status,
      employmentType,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await employeeService.getEmployees({
      page,
      limit,
      search,
      department,
      status,
      employmentType,
      sortBy,
      sortOrder,
      requestingUser: req.user
    });

    return ApiResponse.paginated(
      res,
      'Employees retrieved successfully',
      result.employees,
      result.pagination
    );
  });

  /**
   * Get single employee details with 360-degree summaries
   * GET /api/employees/:id
   * Accessible by: Authenticated users
   */
  getEmployeeById = asyncHandler(async (req, res) => {
    const employee = await employeeService.getEmployeeById(req.params.id, { requestingUser: req.user });

    return ApiResponse.success(
      res,
      'Employee details retrieved successfully',
      employee,
      200
    );
  });

  /**
   * Update employee record
   * PUT /api/employees/:id
   * Accessible by: Admin only
   */
  updateEmployee = asyncHandler(async (req, res) => {
    const updatedEmployee = await employeeService.updateEmployee(
      req.params.id,
      req.body
    );

    return ApiResponse.success(
      res,
      'Employee updated successfully',
      updatedEmployee,
      200
    );
  });

  /**
   * Delete an employee record
   * DELETE /api/employees/:id
   * Accessible by: Admin only
   */
  deleteEmployee = asyncHandler(async (req, res) => {
    const result = await employeeService.deleteEmployee(req.params.id);

    return ApiResponse.success(
      res,
      'Employee deleted successfully',
      result,
      200
    );
  });
}

module.exports = new EmployeeController();
