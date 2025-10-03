import { ConsolidatorService } from '../services/ConsolidatorService.js';

/**
 * Interface para Job do Bull
 */
interface Job<T = any> {
  data: T;
  opts: any;
}

/**
 * Job executado no cutoff de cada draw
 */
export const consolidateDrawJob = {
  name: 'consolidate-draw',
  handler: async (job: Job<{ drawId: number }>) => {
    const { drawId } = job.data;
    console.log(`Starting consolidation job for draw ${drawId}`);
    
    try {
      const consolidator = new ConsolidatorService();
      await consolidator.processDrawConsolidation(drawId);
      
      console.log(`Consolidation job completed successfully for draw ${drawId}`);
    } catch (error) {
      console.error(`Consolidation job failed for draw ${drawId}:`, error);
      throw error;
    }
  }
};

/**
 * Job para requestar randomness após consolidação
 */
export const requestRandomnessJob = {
  name: 'request-randomness',
  handler: async (job: Job<{ drawId: number }>) => {
    const { drawId } = job.data;
    console.log(`Starting randomness request job for draw ${drawId}`);
    
    try {
      // Em produção, usaria RandomnessService real
      // const randomnessService = new RandomnessService();
      // await randomnessService.requestRandomness(drawId);
      
      console.log(`Randomness request job completed for draw ${drawId}`);
    } catch (error) {
      console.error(`Randomness request job failed for draw ${drawId}:`, error);
      throw error;
    }
  }
};

/**
 * Job para calcular números vencedores após randomness
 */
export const calculateWinningNumbersJob = {
  name: 'calculate-winning-numbers',
  handler: async (job: Job<{ drawId: number }>) => {
    const { drawId } = job.data;
    console.log(`Starting winning numbers calculation for draw ${drawId}`);
    
    try {
      // Em produção, buscaria o randomness do banco e calcularia os números
      // const draw = await drawRepository.findById(drawId);
      // if (!draw.randomness) {
      //   throw new Error('No randomness available for draw');
      // }
      
      // const winningNumbers = RandomnessDerivation.deriveWinningNumbers(draw.randomness, draw.game);
      // await drawRepository.updateWinningNumbers(drawId, winningNumbers);
      
      console.log(`Winning numbers calculation completed for draw ${drawId}`);
    } catch (error) {
      console.error(`Winning numbers calculation failed for draw ${drawId}:`, error);
      throw error;
    }
  }
};

/**
 * Job para calcular vencedores após números serem definidos
 */
export const calculateWinnersJob = {
  name: 'calculate-winners',
  handler: async (job: Job<{ drawId: number }>) => {
    const { drawId } = job.data;
    console.log(`Starting winners calculation for draw ${drawId}`);
    
    try {
      const consolidator = new ConsolidatorService();
      
      // Em produção, buscaria números vencedores do banco
      const mockWinningNumbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4];
      
      const winnersByTier = await consolidator.calculateWinners(drawId, mockWinningNumbers);
      
      // Salvaria resultados no banco
      // await drawResultRepository.create({
      //   drawId,
      //   winnersByTier,
      //   totalWinners: Object.values(winnersByTier).reduce((sum, tier) => sum + tier.count, 0)
      // });
      
      console.log(`Winners calculation completed for draw ${drawId}`);
    } catch (error) {
      console.error(`Winners calculation failed for draw ${drawId}:`, error);
      throw error;
    }
  }
};

/**
 * Job para finalizar draw (marcar como SETTLED)
 */
export const settleDrawJob = {
  name: 'settle-draw',
  handler: async (job: Job<{ drawId: number }>) => {
    const { drawId } = job.data;
    console.log(`Starting draw settlement for draw ${drawId}`);
    
    try {
      // Em produção, marcaria o draw como settled no banco
      // await drawRepository.updateStatus(drawId, DrawStatus.SETTLED);
      
      console.log(`Draw settlement completed for draw ${drawId}`);
    } catch (error) {
      console.error(`Draw settlement failed for draw ${drawId}:`, error);
      throw error;
    }
  }
};

/**
 * Array com todos os jobs de draw para registro
 */
export const drawJobs = [
  consolidateDrawJob,
  requestRandomnessJob,
  calculateWinningNumbersJob,
  calculateWinnersJob,
  settleDrawJob
];