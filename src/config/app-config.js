import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`✅ Loaded environment`);
console.log(`🌍 NODE_ENV = ${NODE_ENV}`);

const APP_CONFIG = {
  service: {
    name: process.env.SERVICE_NAME || "node-auth-api",
    version: process.env.SERVICE_VERSION || "1.0.0",
  },
  
  server: {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
  },

  database: {
    dialect: process.env.DB_DIALECT || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "test-auth",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "",
    expire: process.env.JWT_EXPIRE || "24h",
    accessExpire: process.env.JWT_ACCESS_EXPIRE || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "",
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || "7d",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || "smtp",

    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === "true",
    },

    gmail: {
      user: process.env.GMAIL_USER,
      appPassword: process.env.GMAIL_APP_PASSWORD,
    },

    from: process.env.EMAIL_FROM || "",
    fromName: process.env.EMAIL_FROM_NAME || "Application Team",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },

  emailVerification: {
    enabled: process.env.EMAIL_VERIFICATION_ENABLED === "true",
    expiryHours: Number(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS) || 24,
    allowUnverifiedLogin: process.env.ALLOW_UNVERIFIED_LOGIN === "true",
    resendCooldownMinutes: Number(process.env.VERIFICATION_RESEND_COOLDOWN) || 5,
    maxAttempts: Number(process.env.MAX_VERIFICATION_ATTEMPTS) || 3,

    requireForLogin: process.env.REQUIRE_EMAIL_VERIFICATION_FOR_LOGIN === "true",
    requireForProfile: process.env.REQUIRE_EMAIL_VERIFICATION_FOR_PROFILE === "true",
    requireForSensitive: process.env.REQUIRE_EMAIL_VERIFICATION_FOR_SENSITIVE === "true",
  },

  logtail: {
    sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
    endpoint: process.env.LOGTAIL_ENDPOINT,
  },

  log: {
    level: process.env.LOG_LEVEL || "info",
  },
};

export default APP_CONFIG;
