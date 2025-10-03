/**
 * Configurações blockchain e smart contracts
 */
export const blockchainConfig = {
  networks: {
    mainnet: {
      rpcUrl: process.env.MAINNET_RPC_URL || '',
      contractAddress: process.env.MAINNET_CONTRACT_ADDRESS || '',
      startBlock: parseInt(process.env.MAINNET_START_BLOCK || '0'),
      chainId: 1,
      confirmations: 12
    },
    goerli: {
      rpcUrl: process.env.GOERLI_RPC_URL || 'https://goerli.infura.io/v3/YOUR-PROJECT-ID',
      contractAddress: process.env.GOERLI_CONTRACT_ADDRESS || '',
      startBlock: parseInt(process.env.GOERLI_START_BLOCK || '0'),
      chainId: 5,
      confirmations: 2
    },
    sepolia: {
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
      contractAddress: process.env.SEPOLIA_CONTRACT_ADDRESS || '',
      startBlock: parseInt(process.env.SEPOLIA_START_BLOCK || '0'),
      chainId: 11155111,
      confirmations: 2
    },
    local: {
      rpcUrl: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
      contractAddress: process.env.LOCAL_CONTRACT_ADDRESS || '',
      startBlock: 0,
      chainId: 1337,
      confirmations: 1
    }
  },
  consolidator: {
    privateKey: process.env.CONSOLIDATOR_PRIVATE_KEY || '',
    gasLimit: process.env.GAS_LIMIT || '500000',
    gasPrice: process.env.GAS_PRICE || '20000000000', // 20 gwei
    maxFeePerGas: process.env.MAX_FEE_PER_GAS || '100000000000', // 100 gwei
    maxPriorityFeePerGas: process.env.MAX_PRIORITY_FEE_PER_GAS || '2000000000' // 2 gwei
  },
  indexer: {
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '1000'),
    retryAttempts: parseInt(process.env.INDEXER_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.INDEXER_RETRY_DELAY || '5000'),
    maxBlockRange: parseInt(process.env.INDEXER_MAX_BLOCK_RANGE || '10000')
  }
};

/**
 * Obtém configuração da rede ativa
 */
export const getActiveNetworkConfig = () => {
  const network = process.env.NETWORK || 'local';
  const config = blockchainConfig.networks[network as keyof typeof blockchainConfig.networks];
  
  if (!config) {
    throw new Error(`Network configuration not found: ${network}`);
  }
  
  return { ...config, name: network };
};

/**
 * Validação das configurações blockchain
 */
export const validateBlockchainConfig = (): void => {
  const network = getActiveNetworkConfig();
  
  if (!network.rpcUrl) {
    throw new Error(`RPC URL not configured for network: ${network.name}`);
  }
  
  if (!network.contractAddress) {
    console.warn(`Contract address not configured for network: ${network.name}`);
  }
  
  if (blockchainConfig.consolidator.privateKey && blockchainConfig.consolidator.privateKey.length !== 66) {
    throw new Error('Invalid consolidator private key format');
  }
};

/**
 * ABI do contrato (placeholder - em produção seria o ABI real)
 */
export const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "ticketId", "type": "uint256"},
      {"indexed": true, "name": "player", "type": "address"},
      {"indexed": false, "name": "game", "type": "uint8"},
      {"indexed": false, "name": "numbersPacked", "type": "uint256"},
      {"indexed": false, "name": "roundsBought", "type": "uint256"},
      {"indexed": false, "name": "firstDrawId", "type": "uint256"}
    ],
    "name": "TicketMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "drawId", "type": "uint256"},
      {"indexed": false, "name": "game", "type": "uint8"},
      {"indexed": false, "name": "scheduledTime", "type": "uint256"},
      {"indexed": false, "name": "cutoffTime", "type": "uint256"}
    ],
    "name": "DrawCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "drawId", "type": "uint256"},
      {"indexed": false, "name": "merkleRoot", "type": "bytes32"},
      {"indexed": false, "name": "totalPool", "type": "uint256"},
      {"indexed": false, "name": "ticketCount", "type": "uint256"}
    ],
    "name": "DrawConsolidated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "drawId", "type": "uint256"},
      {"indexed": false, "name": "randomness", "type": "bytes32"}
    ],
    "name": "RandomnessFulfilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "ticketId", "type": "uint256"},
      {"indexed": true, "name": "player", "type": "address"},
      {"indexed": false, "name": "drawId", "type": "uint256"},
      {"indexed": false, "name": "tier", "type": "uint8"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "PrizeClaimed",
    "type": "event"
  }
];