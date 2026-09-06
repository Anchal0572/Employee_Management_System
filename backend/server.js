const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

/**
 * Bootstrap the EMS backend application
 */
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start HTTP Server
  server = app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 EMS Backend Server running in [${config.env}] mode`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🏥 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`🌐 Allowed Client: ${config.clientUrl}`);
    console.log(`=======================================================`);
  });
};

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('[Process] Unhandled Rejection:', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  process.exit(1);
});

// Handle Graceful Termination (SIGTERM / SIGINT)
const gracefulShutdown = async (signal) => {
  console.log(`\n[Process] ${signal} signal received. Closing HTTP server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[Process] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
