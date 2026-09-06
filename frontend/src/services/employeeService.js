import api from './api';

export const employeeService = {
  /**
   * Fetch paginated employees list with optional search and filters
   * GET /api/employees
   */
  async getEmployees(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.department && params.department !== 'All') queryParams.append('department', params.department);
    if (params.status && params.status !== 'All') queryParams.append('status', params.status);
    if (params.employmentType && params.employmentType !== 'All') queryParams.append('employmentType', params.employmentType);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.order) queryParams.append('order', params.order);

    const queryString = queryParams.toString();
    const url = queryString ? `/employees?${queryString}` : '/employees';

    const response = await api.get(url);
    return {
      employees: response.data || [],
      pagination: response.meta?.pagination || {
        total: response.data?.length || 0,
        totalPages: 1,
        page: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  },

  /**
   * Convenience alias for getEmployees — returns full API response shape
   * Used by payroll and other modules that need the raw API response
   */
  async getAll(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);
    const qs = queryParams.toString();
    const url = qs ? `/employees?${qs}` : '/employees';
    return await api.get(url);
  },

  /**
   * Fetch single employee details by ID with attendance, leave and payslip summaries
   * GET /api/employees/:id
   */
  async getEmployeeById(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Create a new employee record (Admin only)
   * POST /api/employees
   */
  async createEmployee(employeeData) {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  /**
   * Update an existing employee record (Admin only)
   * PUT /api/employees/:id
   */
  async updateEmployee(id, employeeData) {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  /**
   * Delete an employee record (Admin only)
   * DELETE /api/employees/:id
   */
  async deleteEmployee(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};

export default employeeService;
