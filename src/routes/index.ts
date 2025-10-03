import { Router } from 'express';
import { ticketsRouter } from './tickets.js';
import { healthRouter } from './health.js';
import { drawsRouter } from './draws.js';
import { statsRouter } from './stats.js';

export const router = Router();

router.use('/tickets', ticketsRouter);
router.use('/health', healthRouter);
router.use('/draws', drawsRouter);
router.use('/stats', statsRouter);
