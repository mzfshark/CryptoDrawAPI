/**
 * Configurações do banco de dados
 */
export const databaseConfig = {
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cryptodraw',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production',
    logging: process.env.NODE_ENV === 'development',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    timeout: parseInt(process.env.DB_TIMEOUT || '60000')
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_PREFIX || 'cryptodraw:',
    retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000')
  }
};

/**
 * String de conexão do PostgreSQL
 */
export const getDatabaseUrl = (): string => {
  const config = databaseConfig.postgres;
  return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
};

/**
 * Configurações específicas do Prisma
 */
export const prismaConfig = {
  datasourceUrl: getDatabaseUrl(),
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty' as const
};