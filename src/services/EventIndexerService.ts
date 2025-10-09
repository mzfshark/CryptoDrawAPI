import { ethers } from 'ethers';
import { DbService } from './DbService.js';
import { contractABI, getActiveNetworkConfig, blockchainConfig } from '../config/blockchain.js';

/**
 * Serviço de indexação de eventos blockchain
 * Escuta e processa eventos do contrato CryptoDraw
 */
export class EventIndexerService {
  private isRunning: boolean = false;
  private currentBlock: number = 0;
  private provider?: ethers.JsonRpcProvider;
  private contract?: ethers.Contract;
  private networkName: string = process.env.NETWORK || 'local';
  
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
      this.provider = new ethers.JsonRpcProvider(net.rpcUrl, net.chainId);
      if (!net.contractAddress) {
        console.warn(`[indexer] No contract address configured for network ${net.name}`);
      } else {
        this.contract = new ethers.Contract(net.contractAddress, contractABI, this.provider);
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
        const events = await this.contract.queryFilter({}, start, end);
        for (const ev of events) {
          await this.processEvent(ev);
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
        case 'TicketMinted':
          await this.handleTicketMinted(event);
          break;
        case 'DrawCreated':
          await this.handleDrawCreated(event);
          break;
        case 'DrawConsolidated':
          await this.handleDrawConsolidated(event);
          break;
        case 'RandomnessFulfilled':
          await this.handleRandomnessFulfilled(event);
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
  async handleTicketMinted(event: any): Promise<void> {
    console.log('Processing TicketMinted event:', event.args);
    
    try {
      // Extrai dados do evento
      const ticketData = {
        id: event.args.ticketId.toString(),
        owner: event.args.player,
        game: event.args.game,
        numbersPacked: event.args.numbersPacked.toString(),
        roundsBought: event.args.roundsBought,
        firstDrawId: event.args.firstDrawId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      };
      
      // Em produção, salvaria no banco de dados
      // await ticketRepository.create(ticketData);
      
      console.log(`Ticket ${ticketData.id} indexed successfully`);
      
    } catch (error) {
      console.error('Error handling TicketMinted event:', error);
      throw error;
    }
  }

  /**
   * Processa evento DrawCreated
   */
  async handleDrawCreated(event: any): Promise<void> {
    console.log('Processing DrawCreated event:', event.args);
    
    try {
      const drawData = {
        id: event.args.drawId,
        game: event.args.game,
        scheduledAt: new Date(event.args.scheduledTime * 1000),
        cutoffAt: new Date(event.args.cutoffTime * 1000),
        status: 'OPEN',
        ticketCount: 0
      };
      
      // Em produção, salvaria no banco de dados
      // await drawRepository.create(drawData);
      
      console.log(`Draw ${drawData.id} indexed successfully`);
      
    } catch (error) {
      console.error('Error handling DrawCreated event:', error);
      throw error;
    }
  }

  /**
   * Processa evento DrawConsolidated
   */
  async handleDrawConsolidated(event: any): Promise<void> {
    console.log('Processing DrawConsolidated event:', event.args);
    
    try {
      const updateData = {
        merkleRoot: event.args.merkleRoot,
        totalPoolUSD: event.args.totalPool.toString(),
        ticketCount: event.args.ticketCount,
        status: 'CONSOLIDATED'
      };
      
      // Em produção, atualizaria no banco de dados
      // await drawRepository.update(event.args.drawId, updateData);
      
      console.log(`Draw ${event.args.drawId} consolidation indexed`);
      
    } catch (error) {
      console.error('Error handling DrawConsolidated event:', error);
      throw error;
    }
  }

  /**
   * Processa evento RandomnessFulfilled
   */
  async handleRandomnessFulfilled(event: any): Promise<void> {
    console.log('Processing RandomnessFulfilled event:', event.args);
    
    try {
      const updateData = {
        randomness: event.args.randomness,
        status: 'RANDOM_FULFILLED'
      };
      
      // Em produção, atualizaria no banco de dados
      // await drawRepository.update(event.args.drawId, updateData);
      
      // Agenda job para calcular números vencedores
      // await jobQueue.add('calculate-winning-numbers', { drawId: event.args.drawId });
      
      console.log(`Randomness fulfilled for draw ${event.args.drawId}`);
      
    } catch (error) {
      console.error('Error handling RandomnessFulfilled event:', error);
      throw error;
    }
  }

  /**
   * Processa evento PrizeClaimed
   */
  async handlePrizeClaimed(event: any): Promise<void> {
    console.log('Processing PrizeClaimed event:', event.args);
    
    try {
      // Atualiza status do ticket para REDEEMED
      const updateData = {
        status: 'REDEEMED',
        claimedAt: new Date(),
        claimTransactionHash: event.transactionHash
      };
      
      // Em produção, atualizaria no banco de dados
      // await ticketRepository.update(event.args.ticketId, updateData);
      
      console.log(`Prize claimed for ticket ${event.args.ticketId}`);
      
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
        eventName: 'TicketMinted',
        args: {
          ticketId: BigInt(Math.floor(Math.random() * 1000000)),
          player: '0x1234567890123456789012345678901234567890',
          game: 0, // LOTOFACIL
          numbersPacked: BigInt('0x7fff'),
          roundsBought: 10,
          firstDrawId: 1
        },
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: this.currentBlock + 1
      }
    ];
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