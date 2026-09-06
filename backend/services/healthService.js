const os = require('os');
const { getDbStatus } = require('../config/db');
const config = require('../config/env');

/**
 * Health check service providing system diagnostics
 */
class HealthService {
  /**
   * Basic system status
   */
  getBasicStatus() {
    return {
      success: true,
      message: 'EMS API is running'
    };
  }

  /**
   * Detailed diagnostic telemetry
   */
  getDetailedDiagnostics() {
    const dbStatus = getDbStatus();
    const uptimeSeconds = Math.floor(process.uptime());

    return {
      success: true,
      message: 'EMS API is healthy',
      data: {
        timestamp: new Date().toISOString(),
        environment: config.env,
        service: 'ems-api',
        version: '1.0.0',
        uptime: {
          seconds: uptimeSeconds,
          formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`
        },
        database: {
          provider: 'MongoDB',
          ...dbStatus
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsageMb: {
            rss: (process.memoryUsage().rss / (1024 * 1024)).toFixed(2),
            heapTotal: (process.memoryUsage().heapTotal / (1024 * 1024)).toFixed(2),
            heapUsed: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)
          },
          freeMemoryMb: (os.freemem() / (1024 * 1024)).toFixed(2),
          totalMemoryMb: (os.totalmem() / (1024 * 1024)).toFixed(2)
        }
      }
    };
  }
}

module.exports = new HealthService();
