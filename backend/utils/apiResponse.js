/**
 * Uniform API Response Utility
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Response message
   * @param {any} data - Payload data
   * @param {object} meta - Optional pagination or metadata
   */
  constructor(statusCode = 200, message = 'Success', data = null, meta = undefined) {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (meta) {
      this.meta = meta;
    }
  }

  /**
   * Send JSON response directly using express res object
   * @param {object} res Express response
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      ...(this.data !== undefined ? { data: this.data } : {}),
      ...(this.meta !== undefined ? { meta: this.meta } : {})
    });
  }

  static success(res, message = 'Operation successful', data = null, statusCode = 200, meta = undefined) {
    return new ApiResponse(statusCode, message, data, meta).send(res);
  }

  static created(res, message = 'Resource created successfully', data = null, meta = undefined) {
    return new ApiResponse(201, message, data, meta).send(res);
  }

  static paginated(res, message = 'Resource retrieved successfully', data = [], pagination = {}) {
    return new ApiResponse(200, message, data, { pagination }).send(res);
  }
}

module.exports = ApiResponse;
