import { Router, Request, Response } from 'express';
import { StatsController } from '../controllers/StatsController.js';

const controller = new StatsController();

export const statsRouter = Router();

// GET /api/stats/general - Estatísticas gerais
statsRouter.get('/general', (req: Request, res: Response) => {
  controller.getGeneralStats(req as any, res as any);
});

// GET /api/stats/game/:gameType - Estatísticas por jogo
statsRouter.get('/game/:gameType', (req: Request, res: Response) => {
  controller.getGameStats(req as any, res as any);
});

// GET /api/stats/frequency - Frequência de números
statsRouter.get('/frequency', (req: Request, res: Response) => {
  controller.getNumberFrequency(req as any, res as any);
});