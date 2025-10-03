# CryptoDrawAPI

API backend completa para o sistema CryptoDraw - Uma plataforma de loteria descentralizada baseada em blockchain, com consolidação off-chain, indexação de eventos e sistema completo de draws.

## Stack Tecnológico

- **Runtime**: Node.js 18+ + TypeScript
- **Framework**: Express.js 
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis + ioredis
- **Blockchain**: ethers.js v6
- **Jobs**: Bull/BullMQ para processamento assíncrono
- **GraphQL**: Apollo Server v4
- **Logs**: Winston
- **Métricas**: Prometheus (prom-client)

## Funcionalidades Implementadas

### ✅ Core API
- ✅ Sistema de tickets (CRUD, validação, consultas)
- ✅ Sistema de draws (listagem, resultados, vencedores)
- ✅ Sistema de estatísticas (gerais, por jogo, frequências)
- ✅ Health checks

### ✅ Utilities
- ✅ Packing/Unpacking de números (Lotofácil e SuperSete)
- ✅ Geração e verificação de Merkle Trees
- ✅ Derivação de números vencedores a partir de randomness
- ✅ Validações completas de números por tipo de jogo

### ✅ Services
- ✅ ConsolidatorService (consolidação off-chain)
- ✅ EventIndexerService (indexação de eventos blockchain)
- ✅ BlockchainService (interação com contratos)

### ✅ Background Jobs
- ✅ Jobs de consolidação de draws
- ✅ Jobs de monitoramento e sincronização
- ✅ Jobs de cálculo de vencedores
- ✅ Jobs de limpeza e backup

### ✅ Configurações
- ✅ Configuração completa de banco de dados
- ✅ Configuração de blockchain (múltiplas redes)
- ✅ Schema Prisma completo
- ✅ Variáveis de ambiente documentadas

## Instalação e Configuração

### 1. Clonar o repositório
```bash
git clone <repository-url>
cd CryptoDrawAPI
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 4. Configurar banco de dados
```bash
# Instalar PostgreSQL e criar banco
createdb cryptodraw

# Executar migrations
npm run db:migrate

# Gerar cliente Prisma
npm run db:generate
```

### 5. Executar em desenvolvimento
```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

## Endpoints da API

### Health Check
- `GET /api/health` - Status da API

### Tickets
- `GET /api/tickets/:ticketId` - Buscar ticket por ID
- `GET /api/tickets/user/:address` - Buscar tickets de um usuário
- `GET /api/tickets/:ticketId/proof` - Proof Merkle de vitória
- `POST /api/tickets/validate` - Validar números de ticket

### Draws
- `GET /api/draws` - Listar draws (com filtros e paginação)
- `GET /api/draws/:drawId` - Buscar draw específico
- `GET /api/draws/:drawId/results` - Resultados de um draw
- `GET /api/draws/:drawId/winners` - Vencedores de um draw

### Estatísticas
- `GET /api/stats/general` - Estatísticas gerais do sistema
- `GET /api/stats/game/:gameType` - Estatísticas específicas por jogo
- `GET /api/stats/frequency` - Frequência de números/dígitos

## Tipos de Jogos Suportados

### Lotofácil (GameType.LOTOFACIL = 0)
- **Números**: 15 números únicos de 1 a 25
- **Packing**: Bitmask de 25 bits
- **Tiers de Prêmio**: 15, 14, 13, 12, 11 acertos

### SuperSete (GameType.SUPERSETE = 1)
- **Números**: 7 dígitos de 0 a 9 (um por posição)
- **Packing**: 28 bits (4 bits por dígito)
- **Tiers de Prêmio**: 7, 6, 5, 4, 3 acertos consecutivos (da direita)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Health check**
   ```bash
   curl http://localhost:3000/api/health
   ```

## Environment Variables

- `FRONTEND_ORIGIN`: CORS allow origin (default "*")
- `PORT`: server port (default 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NETWORK`: Blockchain network (mainnet/goerli/sepolia/local)

## Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm run start` - Executa versão compilada
- `npm run type-check` - Verifica tipos TypeScript
- `npm run db:migrate` - Executa migrations do banco
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:seed` - Popula banco com dados iniciais
