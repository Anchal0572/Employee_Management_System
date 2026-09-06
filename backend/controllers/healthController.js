const healthService = require('../services/healthService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller for system health inspection
 */
class HealthController {
  /**
   * Basic health check
   * GET /api/health
   */
  getHealth = asyncHandler(async (req, res) => {
    const status = healthService.getBasicStatus();
    return res.status(200).json(status);
  });

  /**
   * Detailed health diagnostics
   * GET /api/health/details
   */
  getDetailedHealth = asyncHandler(async (req, res) => {
    const diagnostics = healthService.getDetailedDiagnostics();
    return res.status(200).json(diagnostics);
  });
}

module.exports = new HealthController();
