const mongoose = require('mongoose');
const config = require('./env');

const stateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

/**
 * Connect to MongoDB with resilient lifecycle event tracking
 */
const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection lost / disconnected');
    });

    await mongoose.connect(config.mongo.uri, config.mongo.options);
  } catch (error) {
    console.error(`[Database] Failed to connect to MongoDB at ${config.mongo.uri}: ${error.message}`);
    console.info('[Database] Server will continue running. Ensure MongoDB daemon is active or update MONGO_URI in .env.');
  }
};

/**
 * Disconnect from MongoDB gracefully
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected cleanly');
  } catch (error) {
    console.error(`[Database] Error during MongoDB disconnect: ${error.message}`);
  }
};

/**
 * Get current database status summary
 */
const getDbStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    state: stateMap[readyState] || 'unknown',
    isConnected: readyState === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getDbStatus
};
