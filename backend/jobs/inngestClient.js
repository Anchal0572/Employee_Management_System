const { Inngest } = require('inngest');
const config = require('../config/env');

/**
 * Initialize Inngest client for asynchronous event-driven background execution
 */
const inngest = new Inngest({
  id: 'ems-platform',
  eventKey: config.inngest.eventKey
});

module.exports = inngest;
