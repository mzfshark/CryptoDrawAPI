import { Ticket, GameType, TicketStatus } from '../types/Ticket.js';
import { NumberPacking } from '../utils/NumberPacking.js';
import { RandomnessDerivation } from '../utils/RandomnessDerivation.js';

/**
 * Serviço para interação com blockchain e contratos
 */
export class BlockchainService {
  
  /**
   * Busca um ticket específico por ID
   * Em produção, consultaria o contrato ou banco de dados
   */
  async getTicket(ticketId: string): Promise<Ticket | null> {
    try {
      // Mock data - em produção buscaria do banco ou contrato
      const mockTickets: Record<string, Ticket> = {
        '1': {
          id: '1',
          owner: '0x1234567890123456789012345678901234567890',
          game: GameType.LOTOFACIL,
          numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          numbersPacked: '0x7fff',
          roundsBought: 10,
          roundsRemaining: 8,
          firstDrawId: 1,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          expirationAt: new Date('2024-01-11T10:00:00Z'),
          status: TicketStatus.ACTIVE,
          transactionHash: '0xabc123...',
          blockNumber: 123456
        },
        '2': {
          id: '2',
          owner: '0x2345678901234567890123456789012345678901',
          game: GameType.SUPERSETE,
          numbers: [1, 2, 3, 4, 5, 6, 7],
          numbersPacked: '0x1234567',
          roundsBought: 5,
          roundsRemaining: 3,
          firstDrawId: 2,
          createdAt: new Date('2024-01-02T10:00:00Z'),
          expirationAt: new Date('2024-01-07T10:00:00Z'),
          status: TicketStatus.ACTIVE,
          transactionHash: '0xdef456...',
          blockNumber: 123457
        }
      };
      
      return mockTickets[ticketId] || null;
      
    } catch (error) {
      console.error(`Error fetching ticket ${ticketId}:`, error);
      return null;
    }
  }

  /**
   * Busca todos os tickets de um endereço
   * Em produção, consultaria o banco de dados indexado
   */
  async getUserTickets(address: string): Promise<Ticket[]> {
    try {
      // Mock data - filtra por endereço
      const allTickets = [
        {
          id: '1',
          owner: '0x1234567890123456789012345678901234567890',
          game: GameType.LOTOFACIL,
          numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          numbersPacked: '0x7fff',
          roundsBought: 10,
          roundsRemaining: 8,
          firstDrawId: 1,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          expirationAt: new Date('2024-01-11T10:00:00Z'),
          status: TicketStatus.ACTIVE,
          transactionHash: '0xabc123...',
          blockNumber: 123456
        },
        {
          id: '3',
          owner: '0x1234567890123456789012345678901234567890',
          game: GameType.SUPERSETE,
          numbers: [9, 8, 7, 6, 5, 4, 3],
          numbersPacked: '0x9876543',
          roundsBought: 7,
          roundsRemaining: 5,
          firstDrawId: 1,
          createdAt: new Date('2024-01-01T11:00:00Z'),
          expirationAt: new Date('2024-01-08T11:00:00Z'),
          status: TicketStatus.ACTIVE,
          transactionHash: '0x789abc...',
          blockNumber: 123458
        }
      ];
      
      return allTickets.filter(ticket => ticket.owner.toLowerCase() === address.toLowerCase());
      
    } catch (error) {
      console.error(`Error fetching tickets for address ${address}:`, error);
      return [];
    }
  }

  /**
   * Verifica se um ticket é vencedor em um draw específico
   */
  async checkWinning(ticketId: string, drawId: number): Promise<{ 
    isWinner: boolean; 
    tier?: number; 
    prizeAmount?: string;
    matchCount?: number;
  }> {
    try {
      const ticket = await this.getTicket(ticketId);
      if (!ticket) {
        return { isWinner: false };
      }
      
      // Verifica se o ticket é válido para este draw
      if (ticket.firstDrawId > drawId || drawId > ticket.firstDrawId + ticket.roundsBought - 1) {
        return { isWinner: false };
      }
      
      // Mock winning numbers para o draw
      const mockWinningNumbers = drawId === 1 ? 
        [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4] : // Lotofácil
        [1, 2, 3, 4, 5, 6, 7]; // SuperSete
      
      const result = RandomnessDerivation.checkWinning(ticket.numbers, mockWinningNumbers, ticket.game);
      
      // Calcula prêmio baseado no tier
      let prizeAmount = '0';
      if (result.isWinner && result.tier) {
        const prizeAmounts = ticket.game === GameType.LOTOFACIL ? {
          1: '15000.00',
          2: '800.00', 
          3: '80.00',
          4: '15.00',
          5: '3.00'
        } : {
          1: '20000.00',
          2: '2000.00',
          3: '200.00', 
          4: '40.00',
          5: '8.00'
        };
        prizeAmount = prizeAmounts[result.tier as keyof typeof prizeAmounts] || '0';
      }
      
      return {
        isWinner: result.isWinner,
        tier: result.tier,
        prizeAmount,
        matchCount: result.matchCount
      };
      
    } catch (error) {
      console.error(`Error checking winning for ticket ${ticketId} in draw ${drawId}:`, error);
      return { isWinner: false };
    }
  }

  /**
   * Mintear um novo ticket (interagiria com o contrato)
   */
  async mintTicket(
    owner: string,
    game: GameType,
    numbers: number[],
    roundsToBuy: number
  ): Promise<string> {
    try {
      // Valida números
      if (!NumberPacking.validateNumbers(numbers, game)) {
        throw new Error('Invalid numbers for game type');
      }
      
      // Pack numbers
      const packedNumbers = NumberPacking.packNumbers(numbers, game);
      
      // Em produção, chamaria o contrato smart contract
      // const contract = new ethers.Contract(contractAddress, abi, signer);
      // const tx = await contract.mintTicket(game, packedNumbers, roundsToBuy);
      // await tx.wait();
      // return tx.hash;
      
      // Mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log(`Mock ticket minted for ${owner}, game: ${game}, rounds: ${roundsToBuy}`);
      console.log(`Transaction hash: ${mockTxHash}`);
      
      return mockTxHash;
      
    } catch (error) {
      console.error('Error minting ticket:', error);
      throw error;
    }
  }

  /**
   * Claim prize de um ticket vencedor
   */
  async claimPrize(
    ticketId: string,
    drawId: number,
    merkleProof: string[]
  ): Promise<string> {
    try {
      // Em produção, chamaria o contrato smart contract
      // const contract = new ethers.Contract(contractAddress, abi, signer);
      // const tx = await contract.claimPrize(ticketId, drawId, merkleProof);
      // await tx.wait();
      // return tx.hash;
      
      // Mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log(`Mock prize claimed for ticket ${ticketId} in draw ${drawId}`);
      console.log(`Transaction hash: ${mockTxHash}`);
      
      return mockTxHash;
      
    } catch (error) {
      console.error('Error claiming prize:', error);
      throw error;
    }
  }

  /**
   * Verifica saldo de um endereço
   */
  async getBalance(address: string): Promise<string> {
    try {
      // Em produção, consultaria o blockchain
      // const balance = await provider.getBalance(address);
      // return ethers.formatEther(balance);
      
      // Mock balance
      const mockBalance = (Math.random() * 10).toFixed(4);
      return mockBalance;
      
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      return '0';
    }
  }

  /**
   * Obtém informações de um draw do contrato
   */
  async getDrawInfo(drawId: number): Promise<any> {
    try {
      // Em produção, consultaria o contrato
      // const contract = new ethers.Contract(contractAddress, abi, provider);
      // const drawInfo = await contract.draws(drawId);
      
      // Mock draw info
      const mockDrawInfo = {
        id: drawId,
        game: GameType.LOTOFACIL,
        scheduledAt: Math.floor(Date.now() / 1000) + 3600, // 1 hora no futuro
        cutoffAt: Math.floor(Date.now() / 1000) + 3300, // 55 min no futuro
        status: 1, // OPEN
        merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        totalPool: 0,
        randomness: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
      
      return mockDrawInfo;
      
    } catch (error) {
      console.error(`Error fetching draw info for ${drawId}:`, error);
      throw error;
    }
  }
}
