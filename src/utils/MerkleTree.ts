// Implementação simples de hash para Merkle Tree

/**
 * Interface para ticket data usada na geração do leaf hash
 */
export interface TicketLeafData {
  ticketId: string;
  owner: string;
  game: number;
  numbersPacked: number;
  roundsBought: number;
  firstDrawId: number;
}

/**
 * Resultado da construção da Merkle Tree
 */
export interface MerkleTreeResult {
  root: string;
  tree: string[][];
  proofs: { [leaf: string]: string[] };
}

/**
 * Utilitários para Merkle Tree conforme seção 4 da especificação
 */
export class MerkleTree {
  
  /**
   * Função de hash simples para substituir crypto
   */
  private static simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
  
  /**
   * Gera hash do leaf conforme especificação
   * Hash = keccak256(abi.encodePacked(ticketId, owner, game, numbersPacked, roundsBought, firstDrawId))
   */
  static generateLeafHash(ticket: TicketLeafData): string {
    // Simula abi.encodePacked concatenando os valores em formato hexadecimal
    const ticketIdHex = BigInt(ticket.ticketId).toString(16).padStart(64, '0');
    const ownerHex = ticket.owner.slice(2).toLowerCase(); // Remove 0x prefix
    const gameHex = ticket.game.toString(16).padStart(64, '0');
    const numbersPackedHex = ticket.numbersPacked.toString(16).padStart(64, '0');
    const roundsBoughtHex = ticket.roundsBought.toString(16).padStart(64, '0');
    const firstDrawIdHex = ticket.firstDrawId.toString(16).padStart(64, '0');
    
    const packed = ticketIdHex + ownerHex + gameHex + numbersPackedHex + roundsBoughtHex + firstDrawIdHex;
    
    return this.simpleHash(packed);
  }

  /**
   * Constrói Merkle Tree completa
   */
  static buildTree(leaves: string[]): MerkleTreeResult {
    if (leaves.length === 0) {
      throw new Error('Cannot build tree with empty leaves');
    }

    // Garante que temos um número par de leaves (adiciona duplicata se necessário)
    const workingLeaves = [...leaves];
    if (workingLeaves.length % 2 === 1) {
      workingLeaves.push(workingLeaves[workingLeaves.length - 1]);
    }

    const tree: string[][] = [workingLeaves];
    
    // Constrói a árvore nível por nível
    let currentLevel = workingLeaves;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const parent = this.hashPair(left, right);
        nextLevel.push(parent);
      }
      
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }

    const root = currentLevel[0];
    const proofs = this.generateProofs(tree, leaves);

    return {
      root,
      tree,
      proofs
    };
  }

  /**
   * Gera proofs para todos os leaves
   */
  private static generateProofs(tree: string[][], originalLeaves: string[]): { [leaf: string]: string[] } {
    const proofs: { [leaf: string]: string[] } = {};
    
    for (let i = 0; i < originalLeaves.length; i++) {
      const leaf = originalLeaves[i];
      proofs[leaf] = this.generateProofForIndex(tree, i);
    }
    
    return proofs;
  }

  /**
   * Gera proof para um leaf específico pelo índice
   */
  private static generateProofForIndex(tree: string[][], leafIndex: number): string[] {
    const proof: string[] = [];
    let currentIndex = leafIndex;
    
    // Navega pelos níveis da árvore coletando os siblings
    for (let level = 0; level < tree.length - 1; level++) {
      const currentLevel = tree[level];
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      
      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex]);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return proof;
  }

  /**
   * Verifica se um proof é válido
   */
  static verifyProof(leaf: string, proof: string[], root: string): boolean {
    if (proof.length === 0) {
      return leaf === root;
    }
    
    let currentHash = leaf;
    
    for (const proofElement of proof) {
      // Ordena os hashes para garantir determinismo
      if (currentHash <= proofElement) {
        currentHash = this.hashPair(currentHash, proofElement);
      } else {
        currentHash = this.hashPair(proofElement, currentHash);
      }
    }
    
    return currentHash === root;
  }

  /**
   * Combina dois hashes em um hash pai
   */
  private static hashPair(left: string, right: string): string {
    // Remove 0x prefix se presente
    const leftClean = left.startsWith('0x') ? left.slice(2) : left;
    const rightClean = right.startsWith('0x') ? right.slice(2) : right;
    
    // Ordena os hashes lexicograficamente para determinismo
    const [first, second] = leftClean <= rightClean ? [leftClean, rightClean] : [rightClean, leftClean];
    
    const combined = first + second;
    return this.simpleHash(combined);
  }

  /**
   * Função de conveniência para gerar Merkle tree a partir de tickets
   */
  static buildTreeFromTickets(tickets: TicketLeafData[]): MerkleTreeResult {
    const leaves = tickets.map(ticket => this.generateLeafHash(ticket));
    return this.buildTree(leaves);
  }
}