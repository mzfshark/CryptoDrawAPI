import { Ticket, GameType, TicketStatus } from '../types/Ticket.js';
import { Draw, DrawStatus, WinnersByTier } from '../types/Draw.js';
import { MerkleTree, TicketLeafData } from '../utils/MerkleTree.js';
import { NumberPacking } from '../utils/NumberPacking.js';
import { DbService } from './DbService.js';

/**
 * Serviço de consolidação off-chain conforme seção 6 da especificação
 */
export class ConsolidatorService {
  
  /**
   * Coleta tickets válidos após cutoff
   */
  async collectValidTickets(drawId: number): Promise<Ticket[]> {
    try {
      console.log(`Collecting valid tickets for draw ${drawId}`);
      const valid = await DbService.getValidTicketsForDraw(drawId);
      console.log(`Found ${valid.length} valid tickets`);
      // Converte para tipo Ticket do nosso domínio, se necessário
      return valid.map((t: any) => ({
        id: t.id,
        owner: t.owner,
        game: (t.game as string) === 'SUPERSETE' ? GameType.SUPERSETE : GameType.LOTOFACIL,
        numbers: t.numbers as number[],
        numbersPacked: t.numbersPacked,
        roundsBought: t.roundsBought,
        roundsRemaining: t.roundsRemaining,
        firstDrawId: t.firstDrawId,
        createdAt: new Date(t.createdAt),
        expirationAt: new Date(t.expirationAt),
        status: (t.status as string) as any,
        transactionHash: t.txHash,
        blockNumber: Number(t.blockNumber)
      }));
      
    } catch (error) {
      console.error('Error collecting valid tickets:', error);
      throw new Error('Failed to collect valid tickets');
    }
  }

  /**
   * Gera Merkle tree e root
   */
  async generateMerkleTree(tickets: Ticket[]): Promise<{
    root: string;
    leaves: string[];
    proofs: { [ticketId: string]: string[] };
    leafIndexByTicket: { [ticketId: string]: number };
  }> {
    try {
      console.log(`Generating Merkle tree for ${tickets.length} tickets`);
      
      if (tickets.length === 0) {
        throw new Error('Cannot generate Merkle tree with no tickets');
      }
      
      // Converte tickets para formato de leaf data
      const ticketLeafData: TicketLeafData[] = tickets.map(ticket => ({
        ticketId: ticket.id,
        owner: ticket.owner,
        game: ticket.game,
        numbersPacked: parseInt(ticket.numbersPacked, 16) || 0,
        roundsBought: ticket.roundsBought,
        firstDrawId: ticket.firstDrawId
      }));
      
      // Gera hashes dos leaves
      const leaves = ticketLeafData.map(ticket => MerkleTree.generateLeafHash(ticket));
      
      // Constrói Merkle tree
      const treeResult = MerkleTree.buildTree(leaves);
      
      // Mapeia proofs por ticket ID
      const proofsByTicketId: { [ticketId: string]: string[] } = {};
      const leafIndexByTicket: { [ticketId: string]: number } = {};
      tickets.forEach((ticket, index) => {
        const leaf = leaves[index];
        proofsByTicketId[ticket.id] = treeResult.proofs[leaf] || [];
        leafIndexByTicket[ticket.id] = index;
      });
      
      console.log(`Generated Merkle root: ${treeResult.root}`);
      
      return {
        root: treeResult.root,
        leaves,
        proofs: proofsByTicketId,
        leafIndexByTicket
      };
      
    } catch (error) {
      console.error('Error generating Merkle tree:', error);
      throw new Error('Failed to generate Merkle tree');
    }
  }

  /**
   * Submete consolidação ao contrato
   */
  async submitConsolidation(drawId: number, merkleRoot: string, totalPool: string): Promise<string> {
    try {
      console.log(`Submitting consolidation for draw ${drawId}`);
      console.log(`Merkle Root: ${merkleRoot}`);
      console.log(`Total Pool: ${totalPool} USD`);
      
      // Em produção, interagiria com o contrato smart contract via ethers.js
      // const contract = new ethers.Contract(contractAddress, abi, signer);
      // const tx = await contract.consolidateDraw(drawId, merkleRoot, totalPoolWei);
      // await tx.wait();
      
      // Mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log(`Consolidation submitted successfully. TX: ${mockTxHash}`);
      return mockTxHash;
      
    } catch (error) {
      console.error('Error submitting consolidation:', error);
      throw new Error('Failed to submit consolidation to contract');
    }
  }

  /**
   * Calcula vencedores por tier
   */
  async calculateWinners(drawId: number, winningNumbers: number[]): Promise<WinnersByTier> {
    try {
      console.log(`Calculating winners for draw ${drawId}`);
      
      // Busca todos os tickets válidos para este draw
      const validTickets = await this.collectValidTickets(drawId);
      
      // Determina o tipo de jogo baseado no draw
      const gameType = GameType.LOTOFACIL; // Em produção, buscaria do draw
      
      const winnersByTier: WinnersByTier = {};
      
      // Para cada ticket, verifica se é vencedor
      for (const ticket of validTickets) {
        if (ticket.game !== gameType) continue;
        
        const result = this.checkTicketWinning(ticket.numbers, winningNumbers, gameType);
        
        if (result.isWinner && result.tier) {
          if (!winnersByTier[result.tier]) {
            winnersByTier[result.tier] = {
              count: 0,
              prizePerWinner: '0',
              totalPrize: '0'
            };
          }
          winnersByTier[result.tier].count++;
        }
      }
      
      // Calcula distribuição de prêmios
      const totalPrizePool = parseFloat('10000.00'); // Em produção viria do draw
      this.calculatePrizeDistribution(winnersByTier, totalPrizePool, gameType);
      
      console.log('Winners calculated:', winnersByTier);
      return winnersByTier;
      
    } catch (error) {
      console.error('Error calculating winners:', error);
      throw new Error('Failed to calculate winners');
    }
  }

  /**
   * Verifica se um ticket é vencedor
   */
  private checkTicketWinning(ticketNumbers: number[], winningNumbers: number[], game: GameType): {
    isWinner: boolean;
    tier?: number;
    matchCount: number;
  } {
    if (game === GameType.LOTOFACIL) {
      const matches = ticketNumbers.filter(num => winningNumbers.includes(num));
      const matchCount = matches.length;
      
      // Tiers do Lotofácil
      let tier: number | undefined;
      if (matchCount === 15) tier = 1;
      else if (matchCount === 14) tier = 2;
      else if (matchCount === 13) tier = 3;
      else if (matchCount === 12) tier = 4;
      else if (matchCount === 11) tier = 5;
      
      return {
        isWinner: tier !== undefined,
        tier,
        matchCount
      };
    } else if (game === GameType.SUPERSETE) {
      let consecutiveMatches = 0;
      
      // No SuperSete, conta matches consecutivos a partir da direita
      for (let i = ticketNumbers.length - 1; i >= 0; i--) {
        if (ticketNumbers[i] === winningNumbers[i]) {
          consecutiveMatches++;
        } else {
          break;
        }
      }
      
      // Tiers do SuperSete baseados em matches consecutivos
      let tier: number | undefined;
      if (consecutiveMatches === 7) tier = 1;
      else if (consecutiveMatches === 6) tier = 2;
      else if (consecutiveMatches === 5) tier = 3;
      else if (consecutiveMatches === 4) tier = 4;
      else if (consecutiveMatches === 3) tier = 5;
      
      return {
        isWinner: tier !== undefined,
        tier,
        matchCount: consecutiveMatches
      };
    }
    
    return { isWinner: false, matchCount: 0 };
  }

  /**
   * Calcula distribuição de prêmios por tier
   */
  private calculatePrizeDistribution(winnersByTier: WinnersByTier, totalPrizePool: number, game: GameType): void {
    // Percentuais de distribuição por tier (mock - em produção seria configurável)
    const distributionPercentages = game === GameType.LOTOFACIL ? {
      1: 0.5,  // 50% para tier 1
      2: 0.25, // 25% para tier 2
      3: 0.15, // 15% para tier 3
      4: 0.08, // 8% para tier 4
      5: 0.02  // 2% para tier 5
    } : {
      1: 0.6,  // 60% para tier 1
      2: 0.2,  // 20% para tier 2
      3: 0.12, // 12% para tier 3
      4: 0.06, // 6% para tier 4
      5: 0.02  // 2% para tier 5
    };
    
    for (const tier in winnersByTier) {
      const tierNum = parseInt(tier);
      const tierInfo = winnersByTier[tierNum];
      const percentage = distributionPercentages[tierNum as keyof typeof distributionPercentages] || 0;
      
      const totalTierPrize = totalPrizePool * percentage;
      const prizePerWinner = tierInfo.count > 0 ? totalTierPrize / tierInfo.count : 0;
      
      tierInfo.totalPrize = totalTierPrize.toFixed(2);
      tierInfo.prizePerWinner = prizePerWinner.toFixed(2);
    }
  }

  /**
   * Processa consolidação completa de um draw
   */
  async processDrawConsolidation(drawId: number): Promise<void> {
    try {
      console.log(`Starting consolidation process for draw ${drawId}`);
      
      // 1. Coleta tickets válidos
      const validTickets = await this.collectValidTickets(drawId);
      
      if (validTickets.length === 0) {
        console.log(`No valid tickets found for draw ${drawId}, skipping consolidation`);
        return;
      }
      
      // 2. Calcula pool total (soma dos valores dos tickets)
      const totalPool = (validTickets.length * 2.50).toFixed(2); // Mock: R$ 2,50 por ticket
      
      // 3. Gera Merkle tree
      const merkleResult = await this.generateMerkleTree(validTickets);
      
      // 4. Submete ao contrato
      await this.submitConsolidation(drawId, merkleResult.root, totalPool);
      
      // 5. Atualiza status do draw no banco
      // Em produção: await drawRepository.updateDrawStatus(drawId, DrawStatus.CONSOLIDATED);
      
      console.log(`Consolidation completed successfully for draw ${drawId}`);
      
    } catch (error) {
      console.error(`Error in consolidation process for draw ${drawId}:`, error);
      throw error;
    }
  }
}