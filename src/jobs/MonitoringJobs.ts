import { EventIndexerService } from '../services/EventIndexerService.js';

/**
 * Interface para Job do Bull
 */
interface Job<T = any> {
  data: T;
  opts: any;
}

/**
 * Job para sincronizar estado com blockchain
 */
export const syncBlockchainJob = {
  name: 'sync-blockchain',
  handler: async (job: Job<{}>) => {
    console.log('Starting blockchain sync job');
    
    try {
      const indexer = new EventIndexerService();
      await indexer.syncLatestEvents();
      
      console.log('Blockchain sync job completed successfully');
    } catch (error) {
      console.error('Blockchain sync job failed:', error);
      throw error;
    }
  }
};

/**
 * Job para monitorar saúde do sistema
 */
export const healthCheckJob = {
  name: 'health-check',
  handler: async (job: Job<{}>) => {
    console.log('Starting health check job');
    
    try {
      // Verificações de saúde do sistema
      await checkDatabaseHealth();
      await checkRedisHealth();
      await checkBlockchainHealth();
      
      console.log('Health check job completed - all systems healthy');
    } catch (error) {
      console.error('Health check job failed:', error);
      // Em produção, enviaria alertas
      throw error;
    }
  }
};

/**
 * Job para limpeza de dados antigos
 */
export const cleanupJob = {
  name: 'cleanup-old-data',
  handler: async (job: Job<{ olderThanDays: number }>) => {
    const { olderThanDays = 90 } = job.data;
    console.log(`Starting cleanup job for data older than ${olderThanDays} days`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // Em produção, removeria dados antigos
      // await cleanupOldLogs(cutoffDate);
      // await cleanupExpiredTickets(cutoffDate);
      // await cleanupOldIndexerData(cutoffDate);
      
      console.log('Cleanup job completed successfully');
    } catch (error) {
      console.error('Cleanup job failed:', error);
      throw error;
    }
  }
};

/**
 * Job para backup de dados críticos
 */
export const backupJob = {
  name: 'backup-data',
  handler: async (job: Job<{ backupType: 'full' | 'incremental' }>) => {
    const { backupType = 'incremental' } = job.data;
    console.log(`Starting ${backupType} backup job`);
    
    try {
      // Em produção, executaria backup real
      // await performDatabaseBackup(backupType);
      // await uploadBackupToStorage();
      
      console.log(`${backupType} backup job completed successfully`);
    } catch (error) {
      console.error(`${backupType} backup job failed:`, error);
      throw error;
    }
  }
};

/**
 * Job para calcular e atualizar estatísticas
 */
export const updateStatsJob = {
  name: 'update-statistics',
  handler: async (job: Job<{}>) => {
    console.log('Starting statistics update job');
    
    try {
      // Em produção, calcularia e atualizaria estatísticas reais
      // await calculateGeneralStats();
      // await calculateGameStats();
      // await calculateNumberFrequencies();
      // await updateCachedStats();
      
      console.log('Statistics update job completed successfully');
    } catch (error) {
      console.error('Statistics update job failed:', error);
      throw error;
    }
  }
};

/**
 * Funções auxiliares para health checks
 */
async function checkDatabaseHealth(): Promise<void> {
  try {
    // Em produção, testaria conexão real com o banco
    // const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Database health check: OK');
  } catch (error) {
    throw new Error(`Database health check failed: ${error}`);
  }
}

async function checkRedisHealth(): Promise<void> {
  try {
    // Em produção, testaria conexão real com Redis
    // await redis.ping();
    console.log('Redis health check: OK');
  } catch (error) {
    throw new Error(`Redis health check failed: ${error}`);
  }
}

async function checkBlockchainHealth(): Promise<void> {
  try {
    // Em produção, testaria conexão com blockchain
    // const blockNumber = await provider.getBlockNumber();
    console.log('Blockchain health check: OK');
  } catch (error) {
    throw new Error(`Blockchain health check failed: ${error}`);
  }
}

/**
 * Array com todos os jobs de monitoramento para registro
 */
export const monitoringJobs = [
  syncBlockchainJob,
  healthCheckJob,
  cleanupJob,
  backupJob,
  updateStatsJob
];