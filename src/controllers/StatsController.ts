import type { Request, Response } from 'express';
import { GameType } from '../types/Ticket.js';

export class StatsController {
  
  /**
   * GET /api/stats/general
   * Estatísticas gerais do sistema
   */
  async getGeneralStats(req: Request, res: Response): Promise<void> {
    try {
      // Mock data - em produção viria do banco
      const generalStats = {
        totalTicketsSold: 150000,
        totalPrizesAwarded: '2500000.00',
        activeDraws: 2,
        totalDraws: 150,
        totalPlayers: 25000,
        totalPoolValue: '75000.00',
        gamesStats: {
          [GameType.LOTOFACIL]: {
            totalTickets: 95000,
            totalPrizes: '1800000.00',
            avgTicketsPerDraw: 950
          },
          [GameType.SUPERSETE]: {
            totalTickets: 55000,
            totalPrizes: '700000.00',
            avgTicketsPerDraw: 650
          }
        }
      };
      
      res.json({
        success: true,
        data: generalStats
      });
    } catch (error) {
      console.error('Error fetching general stats:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }

  /**
   * GET /api/stats/game/:gameType
   * Estatísticas específicas de um jogo
   */
  async getGameStats(req: Request, res: Response): Promise<void> {
    try {
      const { gameType } = req.params;
      const gameNum = Number(gameType);
      
      if (gameNum !== GameType.LOTOFACIL && gameNum !== GameType.SUPERSETE) {
        res.status(400).json({ 
          error: 'Invalid game type', 
          code: 'INVALID_GAME_TYPE' 
        });
        return;
      }
      
      // Mock data baseado no tipo de jogo
      const gameStats = gameNum === GameType.LOTOFACIL ? {
        game: 'LOTOFACIL',
        totalTickets: 95000,
        totalDraws: 75,
        totalPrizes: '1800000.00',
        avgTicketsPerDraw: 950,
        avgPrizePerDraw: '24000.00',
        winningStats: {
          tier1: { totalWinners: 75, avgPrize: '15000.00' },
          tier2: { totalWinners: 1125, avgPrize: '800.00' },
          tier3: { totalWinners: 11250, avgPrize: '80.00' },
          tier4: { totalWinners: 60000, avgPrize: '15.00' },
          tier5: { totalWinners: 150000, avgPrize: '3.00' }
        },
        popularNumbers: [7, 13, 21, 3, 17, 9, 25, 1, 19, 15],
        leastPopular: [24, 22, 6, 12, 18, 4, 16, 20, 8, 14]
      } : {
        game: 'SUPERSETE',
        totalTickets: 55000,
        totalDraws: 75,
        totalPrizes: '700000.00',
        avgTicketsPerDraw: 650,
        avgPrizePerDraw: '9333.33',
        winningStats: {
          tier1: { totalWinners: 15, avgPrize: '20000.00' },
          tier2: { totalWinners: 150, avgPrize: '2000.00' },
          tier3: { totalWinners: 1500, avgPrize: '200.00' },
          tier4: { totalWinners: 7500, avgPrize: '40.00' },
          tier5: { totalWinners: 22500, avgPrize: '8.00' }
        },
        popularDigitsByPosition: {
          0: [7, 3, 1, 9, 5],
          1: [4, 8, 2, 6, 0],
          2: [9, 1, 5, 7, 3],
          3: [2, 6, 8, 4, 0],
          4: [5, 9, 1, 3, 7],
          5: [8, 4, 2, 6, 0],
          6: [3, 7, 9, 1, 5]
        }
      };
      
      res.json({
        success: true,
        data: gameStats
      });
    } catch (error) {
      console.error('Error fetching game stats:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }

  /**
   * GET /api/stats/frequency
   * Estatísticas de frequência de números/dígitos
   */
  async getNumberFrequency(req: Request, res: Response): Promise<void> {
    try {
      const { game, period = '30' } = req.query as Record<string, string>;
      const gameNum = Number(game);
      
      if (game !== undefined && gameNum !== GameType.LOTOFACIL && gameNum !== GameType.SUPERSETE) {
        res.status(400).json({ 
          error: 'Invalid game type', 
          code: 'INVALID_GAME_TYPE' 
        });
        return;
      }
      
      const periodDays = Math.min(Math.max(Number(period), 1), 365);
      
      // Mock frequency data
      const frequencyData = {
        period: periodDays,
        totalDraws: Math.floor(periodDays / 1), // Assumindo um draw por dia
        games: {} as any
      };
      
      if (!game || gameNum === GameType.LOTOFACIL) {
        frequencyData.games.LOTOFACIL = {
          numberFrequency: Array.from({ length: 25 }, (_, i) => ({
            number: i + 1,
            frequency: Math.floor(Math.random() * 20) + 5, // Mock: 5-24 aparições
            percentage: ((Math.floor(Math.random() * 20) + 5) / frequencyData.totalDraws * 100).toFixed(2)
          })).sort((a, b) => b.frequency - a.frequency),
          hotNumbers: [7, 13, 21, 3, 17], // 5 mais frequentes
          coldNumbers: [24, 22, 6, 12, 18], // 5 menos frequentes
          avgFrequency: 12.5
        };
      }
      
      if (!game || gameNum === GameType.SUPERSETE) {
        frequencyData.games.SUPERSETE = {
          digitFrequencyByPosition: Array.from({ length: 7 }, (_, pos) => ({
            position: pos,
            digits: Array.from({ length: 10 }, (_, digit) => ({
              digit,
              frequency: Math.floor(Math.random() * 15) + 3, // Mock: 3-17 aparições
              percentage: ((Math.floor(Math.random() * 15) + 3) / frequencyData.totalDraws * 100).toFixed(2)
            })).sort((a, b) => b.frequency - a.frequency)
          })),
          hottestDigitsByPosition: Array.from({ length: 7 }, (_, pos) => 
            Math.floor(Math.random() * 10)
          ),
          coldestDigitsByPosition: Array.from({ length: 7 }, (_, pos) => 
            Math.floor(Math.random() * 10)
          )
        };
      }
      
      res.json({
        success: true,
        data: frequencyData
      });
    } catch (error) {
      console.error('Error fetching frequency stats:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }
}