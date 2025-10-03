import { Ticket } from '../types/Ticket';

export class BlockchainService {
  async getTicket(_ticketId: string): Promise<Ticket | null> {
    return null;
  }

  async getUserTickets(_address: string): Promise<Ticket[]> {
    return [];
  }

  async checkWinning(_ticketId: string, _drawId: number): Promise<{ isWinner: boolean; tier?: number; prizeAmount?: string; }> {
    return { isWinner: false };
  }
}
