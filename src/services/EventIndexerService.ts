import { ethers } from 'ethers';
import { DbService } from './DbService.js';
import { NumberPacking } from '../utils/NumberPacking.js';
import { GameType } from '../types/Ticket.js';
import { getActiveNetworkConfig, blockchainConfig } from '../config/blockchain.js';
import CryptoDrawArtifact from '../abis/CryptoDrawV2.sol/CryptoDraw.json' assert { type: 'json' };

/**
 * Serviço de indexação de eventos blockchain
 * Escuta e processa eventos do contrato CryptoDraw
 */
export class EventIndexerService {
  private isRunning: boolean = false;
  private currentBlock: number = 0;
  private provider?: ethers.JsonRpcProvider;
  private contract?: ethers.Contract;
  private networkName!: string;
  
  /**
   * Inicia a indexação de eventos
   */
  async startIndexing(): Promise<void> {
    if (this.isRunning) {
      console.log('Event indexer is already running');
      return;
    }
    
    try {
      console.log('Starting event indexer...');
      this.isRunning = true;
      
      // Configura provider e contrato ethers.js
  const net = getActiveNetworkConfig();
  this.networkName = net.name;
      this.provider = new ethers.JsonRpcProvider(net.rpcUrl, net.chainId);
      if (!net.contractAddress) {
        console.warn(`[indexer] No contract address configured for network ${net.name}`);
      } else {
        const abi = (CryptoDrawArtifact as any).abi;
        this.contract = new ethers.Contract(net.contractAddress, abi, this.provider);
      }
      
      // Recupera último bloco processado do banco
      const last = await DbService.getLastProcessedBlock(this.networkName);
      this.currentBlock = Number(last);
      
      // Inicia loop de monitoramento
      this.startMonitoringLoop();
      
      console.log(`Event indexer started from block ${this.currentBlock}`);
      
    } catch (error) {
      console.error('Error starting event indexer:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Para a indexação
   */
  async stopIndexing(): Promise<void> {
    console.log('Stopping event indexer...');
    this.isRunning = false;
  }

  /**
   * Loop principal de monitoramento
   */
  private async startMonitoringLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Em produção, buscaria novos eventos
        await this.processNewEvents();
        
        // Aguarda antes da próxima verificação
        await this.sleep(5000); // 5 segundos
        
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        await this.sleep(10000); // Wait longer on error
      }
    }
  }

  /**
   * Processa novos eventos desde o último bloco
   */
  private async processNewEvents(): Promise<void> {
    try {
      if (!this.provider || !this.contract) {
        // Sem contrato configurado, faz fallback para mock
        const mockEvents = this.generateMockEvents();
        for (const event of mockEvents) {
          await this.processEvent(event);
        }
        this.currentBlock += 1;
        await DbService.saveLastProcessedBlock(this.networkName, BigInt(this.currentBlock));
        return;
      }

      const latestBlock = await this.provider.getBlockNumber();
      if (latestBlock <= this.currentBlock) {
        return; // nada novo
      }

      const fromBlock = this.currentBlock + 1;
      const toBlock = latestBlock;
      const maxRange = blockchainConfig.indexer.maxBlockRange;

      let start = fromBlock;
      while (start <= toBlock) {
        const end = Math.min(start + maxRange - 1, toBlock);
        // Consultar por blocos e por tópicos pode ser otimizado; por ora, usa queryFilter geral
        const events = await this.contract.queryFilter({}, start, end);
        for (const ev of events) {
          try {
            await this.processEvent(ev);
          } catch (e) {
            console.error('Error processing event log:', e);
          }
        }
        this.currentBlock = end;
        await DbService.saveLastProcessedBlock(this.networkName, BigInt(this.currentBlock));
        start = end + 1;
      }
      
    } catch (error) {
      console.error('Error processing new events:', error);
      throw error;
    }
  }

  /**
   * Processa um evento específico baseado no tipo
   */
  private async processEvent(event: any): Promise<void> {
    try {
      switch (event.eventName) {
        case 'TicketPurchased':
          await this.handleTicketPurchased(event);
          break;
        case 'DrawCreated':
          await this.handleDrawCreated(event);
          break;
        case 'DrawClosed':
          await this.handleDrawClosed(event);
          break;
        case 'DrawCompleted':
          await this.handleDrawCompleted(event);
          break;
        case 'PrizeClaimed':
          await this.handlePrizeClaimed(event);
          break;
        default:
          console.log(`Unknown event type: ${event.eventName}`);
      }
    } catch (error) {
      console.error(`Error processing event ${event.eventName}:`, error);
      throw error;
    }
  }

  /**
   * Processa evento TicketMinted
   */
  async handleTicketPurchased(event: any): Promise<void> {
    console.log('Processing TicketPurchased event:', event.args);
    try {
      // A ABI do CryptoDraw não emite os números escolhidos nem rounds; aqui apenas atualizamos o draw
      const drawId: number = Number(event.args.drawId ?? event.args[3]);
      if (Number.isFinite(drawId)) {
        await DbService.incrementDrawTicketCount(drawId, 1);
      }
    } catch (error) {
      console.error('Error handling TicketPurchased event:', error);
      throw error;
    }
  }

  /**
   * Processa evento DrawCreated
   */
  async handleDrawCreated(event: any): Promise<void> {
    console.log('Processing DrawCreated event:', event.args);
    
    try {
      const drawId: number = Number(event.args.drawId ?? event.args[1]);
      const gameRaw: number = Number(event.args.game ?? event.args[0]);
      const scheduledAtSeconds: bigint = event.args.scheduledAt ?? event.args[2];
      const when = new Date(Number(scheduledAtSeconds) * 1000);
  const game = this.mapGameTypeString(gameRaw);

      await DbService.upsertDraw({
        id: drawId,
        game,
        scheduledAt: when,
        cutoffAt: when,
        status: 'OPEN',
        ticketCount: 0,
      });
      console.log(`Draw ${drawId} indexed successfully`);
      
    } catch (error) {
      console.error('Error handling DrawCreated event:', error);
      throw error;
    }
  }

  /**
   * Processa evento DrawClosed
   */
  async handleDrawClosed(event: any): Promise<void> {
    console.log('Processing DrawClosed event:', event.args);
    try {
      const drawId: number = Number(event.args.drawId ?? event.args[1]);
      let closedAt = new Date();
      if (this.provider && event.blockNumber) {
        const block = await this.provider.getBlock(event.blockNumber);
        if (block?.timestamp) closedAt = new Date(Number(block.timestamp) * 1000);
      }
      await DbService.updateDrawPartial(drawId, { status: 'CLOSED' as any, closedAt });
    } catch (error) {
      console.error('Error handling DrawClosed event:', error);
      throw error;
    }
  }

  /**
   * Processa evento DrawCompleted
   */
  async handleDrawCompleted(event: any): Promise<void> {
    console.log('Processing DrawCompleted event:', event.args);
    try {
      const gameRaw: number = Number(event.args.game ?? event.args[0]);
      const drawId: number = Number(event.args.drawId ?? event.args[1]);
      const winningPackedBN: bigint = event.args.winningNumbers ?? event.args[2];
  const gameEnum = this.mapGameTypeEnum(gameRaw);
  const packedNum = Number(winningPackedBN);
  const nums = NumberPacking.unpackNumbers(packedNum, gameEnum);
      await DbService.updateDrawPartial(drawId, {
        status: 'SETTLED' as any,
        winningPacked: winningPackedBN.toString(),
        winningNumbers: nums,
      } as any);
    } catch (error) {
      console.error('Error handling DrawCompleted event:', error);
      throw error;
    }
  }

  /**
   * Processa evento PrizeClaimed
   */
  async handlePrizeClaimed(event: any): Promise<void> {
    console.log('Processing PrizeClaimed event:', event.args);
    
    try {
      // O evento PrizeClaimed só contém player e amount no CryptoDrawV2
      // Podemos registrar logs/estatísticas futuras aqui; por ora, apenas logamos
      console.log(`Prize claimed by ${event.args.player ?? event.args[0]} amount ${event.args.amount ?? event.args[1]}`);
      
    } catch (error) {
      console.error('Error handling PrizeClaimed event:', error);
      throw error;
    }
  }

  /**
   * Sincroniza eventos perdidos desde um bloco específico
   */
  async syncFromBlock(fromBlock: number): Promise<void> {
    try {
      console.log(`Syncing events from block ${fromBlock}`);
      
      // Em produção, buscaria todos os eventos desde fromBlock
      const mockEvents = this.generateMockEvents();
      
      for (const event of mockEvents) {
        await this.processEvent(event);
      }
      
      console.log('Sync completed successfully');
      
    } catch (error) {
      console.error('Error syncing events:', error);
      throw error;
    }
  }

  /**
   * Busca último bloco processado do banco
   */
  // Persistência movida para DbService

  /**
   * Gera eventos mock para demonstração
   */
  private generateMockEvents(): any[] {
    return [
      {
        eventName: 'TicketPurchased',
        args: {
          ticketId: BigInt(Math.floor(Math.random() * 1000000)),
          player: '0x1234567890123456789012345678901234567890',
          game: 0, // LOTOFACIL
          drawId: 1,
          paymentToken: '0x0000000000000000000000000000000000000000',
          paymentAmount: 0n,
          agent: '0x0000000000000000000000000000000000000000'
        },
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: this.currentBlock + 1
      }
    ];
  }

  /**
   * Mapeia número do enum on-chain para GameType do backend
   */
  private mapGameTypeString(gameRaw: number): 'LOTOFACIL' | 'SUPERSETE' {
    // Assumindo 0 = LOTOFACIL, 1 = SUPERSETE
    return gameRaw === 1 ? 'SUPERSETE' : 'LOTOFACIL';
  }

  private mapGameTypeEnum(gameRaw: number): GameType {
    return gameRaw === 1 ? GameType.SUPERSETE : GameType.LOTOFACIL;
  }

  /**
   * Função utilitária para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sincroniza eventos mais recentes
   */
  async syncLatestEvents(): Promise<void> {
    try {
      await this.processNewEvents();
    } catch (error) {
      console.error('Error syncing latest events:', error);
      throw error;
    }
  }
}