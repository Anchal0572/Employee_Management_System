const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems_db',
    options: {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== 'production'
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'ems_development_super_secret_jwt_key_2025_secure_entropy_32char',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  adminSeed: {
    name: process.env.ADMIN_NAME || 'Anchal Keshri',
    email: process.env.ADMIN_EMAIL || 'anchal.keshri@ems.corp',
    password: process.env.ADMIN_PASSWORD || 'AdminPassword@2025'
  },

  employeeSeed: {
    name: process.env.EMPLOYEE_NAME || 'Sophia Chen',
    email: process.env.EMPLOYEE_EMAIL || 'sophia.chen@ems.corp',
    password: process.env.EMPLOYEE_PASSWORD || 'EmployeePassword@2025'
  },

  inngest: {
    eventKey: process.env.INNGEST_EVENT_KEY || 'local_inngest_key',
    signingKey: process.env.INNGEST_SIGNING_KEY || 'local_inngest_signing_key'
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'EMS Support <no-reply@ems.internal>'
  },

  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:5001',
    apiKey: process.env.AI_SERVICE_API_KEY || ''
  }
};

// Validate production secrets
if (config.isProduction && config.jwt.secret.includes('dev')) {
  console.warn('WARNING: Running in production mode with default JWT secret. Set JWT_SECRET in environment.');
}

module.exports = config;
