import type { Request, Response } from 'express';
import { Draw, DrawStatus } from '../types/Draw.js';
import { GameType } from '../types/Ticket.js';

export class DrawController {
  
  /**
   * GET /api/draws
   * Lista todos os draws com paginação e filtros
   */
  async listDraws(req: Request, res: Response): Promise<void> {
    try {
      const { 
        game, 
        status, 
        limit = '50', 
        offset = '0' 
      } = req.query as Record<string, string>;
      
      // Mock data para demonstração - em produção viria do banco
      const mockDraws: Draw[] = [
        {
          id: 1,
          game: GameType.LOTOFACIL,
          scheduledAt: new Date('2024-01-15T20:00:00Z'),
          cutoffAt: new Date('2024-01-15T19:45:00Z'),
          status: DrawStatus.SETTLED,
          merkleRoot: '0x123...',
          totalPoolUSD: '10000.00',
          randomness: '0xabc123...',
          winningNumbers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4],
          winningPacked: '0x1357...',
          ticketCount: 1500
        },
        {
          id: 2,
          game: GameType.SUPERSETE,
          scheduledAt: new Date('2024-01-16T20:00:00Z'),
          cutoffAt: new Date('2024-01-16T19:45:00Z'),
          status: DrawStatus.OPEN,
          ticketCount: 800
        }
      ];
      
      let filteredDraws = mockDraws;
      
      // Aplica filtros
      if (game !== undefined) {
        const gameType = Number(game);
        if (gameType === GameType.LOTOFACIL || gameType === GameType.SUPERSETE) {
          filteredDraws = filteredDraws.filter(d => d.game === gameType);
        }
      }
      
      if (status) {
        filteredDraws = filteredDraws.filter(d => d.status === status);
      }
      
      // Paginação
      const off = Number(offset) || 0;
      const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const paginatedDraws = filteredDraws.slice(off, off + lim);
      
      res.json({
        success: true,
        data: {
          draws: paginatedDraws,
          total: filteredDraws.length,
          limit: lim,
          offset: off
        }
      });
    } catch (error) {
      console.error('Error listing draws:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }

  /**
   * GET /api/draws/:drawId
   * Busca um draw específico por ID
   */
  async getDraw(req: Request, res: Response): Promise<void> {
    try {
      const { drawId } = req.params;
      
      if (!drawId || !this.isValidDrawId(Number(drawId))) {
        res.status(400).json({ 
          error: 'Invalid draw id', 
          code: 'INVALID_DRAW_ID' 
        });
        return;
      }
      
      // Mock data - em produção buscaria no banco
      const mockDraw: Draw = {
        id: Number(drawId),
        game: GameType.LOTOFACIL,
        scheduledAt: new Date('2024-01-15T20:00:00Z'),
        cutoffAt: new Date('2024-01-15T19:45:00Z'),
        status: DrawStatus.SETTLED,
        merkleRoot: '0x123...',
        totalPoolUSD: '10000.00',
        randomness: '0xabc123...',
        winningNumbers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4],
        winningPacked: '0x1357...',
        ticketCount: 1500
      };
      
      res.json({ 
        success: true, 
        data: mockDraw 
      });
    } catch (error) {
      console.error('Error fetching draw:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }

  /**
   * GET /api/draws/:drawId/results
   * Busca os resultados de um draw específico
   */
  async getDrawResults(req: Request, res: Response): Promise<void> {
    try {
      const { drawId } = req.params;
      
      if (!drawId || !this.isValidDrawId(Number(drawId))) {
        res.status(400).json({ 
          error: 'Invalid draw id', 
          code: 'INVALID_DRAW_ID' 
        });
        return;
      }
      
      // Mock results
      const mockResults = {
        drawId: Number(drawId),
        winningNumbers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4],
        winningPacked: '0x1357...',
        totalPrizePool: '10000.00',
        winnersByTier: {
          1: { count: 1, prizePerWinner: '5000.00', totalPrize: '5000.00' },
          2: { count: 15, prizePerWinner: '200.00', totalPrize: '3000.00' },
          3: { count: 150, prizePerWinner: '10.00', totalPrize: '1500.00' },
          4: { count: 800, prizePerWinner: '1.50', totalPrize: '1200.00' },
          5: { count: 2000, prizePerWinner: '0.15', totalPrize: '300.00' }
        },
        totalWinners: 2966,
        prizeDistribution: [
          { tier: 1, matchCount: 15, winnerCount: 1, prizePerWinner: '5000.00', totalPrize: '5000.00' },
          { tier: 2, matchCount: 14, winnerCount: 15, prizePerWinner: '200.00', totalPrize: '3000.00' },
          { tier: 3, matchCount: 13, winnerCount: 150, prizePerWinner: '10.00', totalPrize: '1500.00' },
          { tier: 4, matchCount: 12, winnerCount: 800, prizePerWinner: '1.50', totalPrize: '1200.00' },
          { tier: 5, matchCount: 11, winnerCount: 2000, prizePerWinner: '0.15', totalPrize: '300.00' }
        ]
      };
      
      res.json({ 
        success: true, 
        data: mockResults 
      });
    } catch (error) {
      console.error('Error fetching draw results:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }

  /**
   * GET /api/draws/:drawId/winners
   * Lista os vencedores de um draw específico
   */
  async getWinners(req: Request, res: Response): Promise<void> {
    try {
      const { drawId } = req.params;
      const { 
        tier, 
        limit = '50', 
        offset = '0' 
      } = req.query as Record<string, string>;
      
      if (!drawId || !this.isValidDrawId(Number(drawId))) {
        res.status(400).json({ 
          error: 'Invalid draw id', 
          code: 'INVALID_DRAW_ID' 
        });
        return;
      }
      
      // Mock winners data
      const mockWinners = [
        {
          ticketId: '1',
          owner: '0x1234567890123456789012345678901234567890',
          tier: 1,
          matchCount: 15,
          prizeAmount: '5000.00',
          claimed: false
        },
        {
          ticketId: '2',
          owner: '0x2345678901234567890123456789012345678901',
          tier: 2,
          matchCount: 14,
          prizeAmount: '200.00',
          claimed: true
        }
      ];
      
      let filteredWinners = mockWinners;
      
      // Filtra por tier se especificado
      if (tier !== undefined) {
        const tierNum = Number(tier);
        if (tierNum >= 1 && tierNum <= 5) {
          filteredWinners = filteredWinners.filter(w => w.tier === tierNum);
        }
      }
      
      // Paginação
      const off = Number(offset) || 0;
      const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const paginatedWinners = filteredWinners.slice(off, off + lim);
      
      res.json({
        success: true,
        data: {
          winners: paginatedWinners,
          total: filteredWinners.length,
          limit: lim,
          offset: off
        }
      });
    } catch (error) {
      console.error('Error fetching winners:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }

  /**
   * Valida se um draw ID é válido
   */
  private isValidDrawId(drawId: number): boolean {
    return Number.isInteger(drawId) && drawId > 0;
  }
}