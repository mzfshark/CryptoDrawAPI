import { Router, Request, Response } from 'express';
import { DrawController } from '../controllers/DrawController.js';

const controller = new DrawController();

export const drawsRouter = Router();

// GET /api/draws - Lista todos os draws
drawsRouter.get('/', (req: Request, res: Response) => {
  controller.listDraws(req as any, res as any);
});

// GET /api/draws/:drawId - Busca draw específico
drawsRouter.get('/:drawId', (req: Request, res: Response) => {
  controller.getDraw(req as any, res as any);
});

// GET /api/draws/:drawId/results - Resultados do draw
drawsRouter.get('/:drawId/results', (req: Request, res: Response) => {
  controller.getDrawResults(req as any, res as any);
});

// GET /api/draws/:drawId/winners - Vencedores do draw
drawsRouter.get('/:drawId/winners', (req: Request, res: Response) => {
  controller.getWinners(req as any, res as any);
});