import 'dotenv/config';

const parseIntegerSetting = (name, value, fallback, minimum = 1) => {
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(
      `${name} must be an integer greater than or equal to ${minimum}`,
    );
  }
  return parsed;
};

const configuredPort = process.env.PORT;
const configuredTrustProxy = process.env.TRUST_PROXY_HOPS;

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseIntegerSetting('PORT', configuredPort, 5000),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  trustProxyHops: parseIntegerSetting(
    'TRUST_PROXY_HOPS',
    configuredTrustProxy,
    0,
    0,
  ),
  databasePoolMax: parseIntegerSetting(
    'DB_POOL_MAX',
    process.env.DB_POOL_MAX,
    10,
  ),
  databaseIdleTimeoutMs: parseIntegerSetting(
    'DB_IDLE_TIMEOUT_MS',
    process.env.DB_IDLE_TIMEOUT_MS,
    30000,
  ),
  databaseConnectionTimeoutMs: parseIntegerSetting(
    'DB_CONNECTION_TIMEOUT_MS',
    process.env.DB_CONNECTION_TIMEOUT_MS,
    10000,
  ),
  jsonBodyLimit: '100kb',
  jwtSecret: process.env.JWT_SECRET,
});

export const requireJwtSecret = () => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET must be configured');
  }
  return config.jwtSecret;
};

export const getDatabaseConnectionString = ({
  preferUnpooled = false,
} = {}) => {
  const connectionString = preferUnpooled
    ? process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
    : process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      preferUnpooled
        ? 'DATABASE_URL_UNPOOLED or DATABASE_URL must be configured'
        : 'DATABASE_URL must be configured',
    );
  }

  return connectionString.replace(/([?&]sslmode=)require\b/, '$1verify-full');
};
