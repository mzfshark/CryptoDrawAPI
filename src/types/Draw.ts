import { GameType } from './Ticket.js';

export enum DrawStatus {
  SCHEDULED = 'SCHEDULED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CONSOLIDATED = 'CONSOLIDATED',
  RANDOM_REQUESTED = 'RANDOM_REQUESTED',
  RANDOM_FULFILLED = 'RANDOM_FULFILLED',
  SETTLED = 'SETTLED'
}

export interface Draw {
  id: number;
  game: GameType;
  scheduledAt: Date;
  cutoffAt: Date;
  status: DrawStatus;
  merkleRoot?: string;
  totalPoolUSD?: string;
  randomness?: string;
  winningNumbers?: number[];
  winningPacked?: string;
  ticketCount: number;
  results?: DrawResults;
}

export interface DrawResults {
  drawId: number;
  winningNumbers: number[];
  winningPacked: string;
  totalPrizePool: string;
  winnersByTier: WinnersByTier;
  totalWinners: number;
  prizeDistribution: PrizeDistribution[];
}

export interface WinnersByTier {
  [tier: number]: {
    count: number;
    prizePerWinner: string;
    totalPrize: string;
  };
}

export interface PrizeDistribution {
  tier: number;
  matchCount: number;
  winnerCount: number;
  prizePerWinner: string;
  totalPrize: string;
}