import { GameType } from '../types/Ticket.js';

/**
 * Utilitários para derivação de números vencedores a partir do randomness
 * Conforme algoritmos da seção 10 da especificação
 */
export class RandomnessDerivation {
  
  /**
   * Deriva números vencedores do Lotofácil
   * Seleciona 15 números únicos de 1-25 usando o randomness como seed
   */
  static deriveLotofacilWinning(randomness: string): number[] {
    // Remove 0x prefix se presente
    const cleanRandomness = randomness.startsWith('0x') ? randomness.slice(2) : randomness;
    
    // Converte para array de bytes
    const bytes = this.hexToBytes(cleanRandomness);
    
    // Gera números únicos de 1-25
    const numbers: number[] = [];
    const available = Array.from({length: 25}, (_, i) => i + 1); // [1, 2, ..., 25]
    
    let byteIndex = 0;
    while (numbers.length < 15 && byteIndex < bytes.length) {
      if (available.length === 0) break;
      
      // Usa o próximo byte para selecionar um índice
      const randomByte = bytes[byteIndex % bytes.length];
      const index = randomByte % available.length;
      
      // Remove e adiciona o número selecionado
      const selectedNumber = available.splice(index, 1)[0];
      numbers.push(selectedNumber);
      
      byteIndex++;
    }
    
    // Se ainda precisamos de mais números (caso randomness seja muito pequeno)
    while (numbers.length < 15 && available.length > 0) {
      const index = (numbers.length * 7) % available.length;
      const selectedNumber = available.splice(index, 1)[0];
      numbers.push(selectedNumber);
    }
    
    return numbers.sort((a, b) => a - b);
  }

  /**
   * Deriva números vencedores do SuperSete
   * Gera 7 dígitos de 0-9 usando o randomness como seed
   */
  static deriveSuperseteWinning(randomness: string): number[] {
    // Remove 0x prefix se presente
    const cleanRandomness = randomness.startsWith('0x') ? randomness.slice(2) : randomness;
    
    // Converte para array de bytes
    const bytes = this.hexToBytes(cleanRandomness);
    
    const digits: number[] = [];
    
    for (let i = 0; i < 7; i++) {
      // Usa um byte diferente para cada dígito, com fallback se não houver bytes suficientes
      const byteIndex = i % bytes.length;
      const randomByte = bytes[byteIndex];
      
      // Gera dígito de 0-9
      const digit = randomByte % 10;
      digits.push(digit);
    }
    
    return digits;
  }

  /**
   * Converte para formato packed baseado no tipo de jogo
   */
  static toPackedFormat(numbers: number[], game: GameType): number {
    switch (game) {
      case GameType.LOTOFACIL:
        return this.packLotofacilNumbers(numbers);
      case GameType.SUPERSETE:
        return this.packSuperseteNumbers(numbers);
      default:
        throw new Error('Unsupported game type');
    }
  }

  /**
   * Função de conveniência para derivar números de qualquer jogo
   */
  static deriveWinningNumbers(randomness: string, game: GameType): number[] {
    switch (game) {
      case GameType.LOTOFACIL:
        return this.deriveLotofacilWinning(randomness);
      case GameType.SUPERSETE:
        return this.deriveSuperseteWinning(randomness);
      default:
        throw new Error('Unsupported game type');
    }
  }

  /**
   * Converte string hexadecimal para array de bytes
   */
  private static hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substr(i, 2), 16);
      if (!isNaN(byte)) {
        bytes.push(byte);
      }
    }
    return bytes;
  }

  /**
   * Pack números do Lotofácil em bitmask
   */
  private static packLotofacilNumbers(numbers: number[]): number {
    let packed = 0;
    for (const num of numbers) {
      packed |= (1 << (num - 1));
    }
    return packed;
  }

  /**
   * Pack números do SuperSete em formato compacto
   */
  private static packSuperseteNumbers(digits: number[]): number {
    let packed = 0;
    for (let i = 0; i < digits.length; i++) {
      packed |= (digits[i] << (i * 4));
    }
    return packed;
  }

  /**
   * Testa se um ticket é vencedor comparando com números vencedores
   */
  static checkWinning(ticketNumbers: number[], winningNumbers: number[], game: GameType): {
    isWinner: boolean;
    matchCount: number;
    tier?: number;
  } {
    switch (game) {
      case GameType.LOTOFACIL:
        return this.checkLotofacilWinning(ticketNumbers, winningNumbers);
      case GameType.SUPERSETE:
        return this.checkSuperseteWinning(ticketNumbers, winningNumbers);
      default:
        return { isWinner: false, matchCount: 0 };
    }
  }

  /**
   * Verifica vitória no Lotofácil
   */
  private static checkLotofacilWinning(ticketNumbers: number[], winningNumbers: number[]): {
    isWinner: boolean;
    matchCount: number;
    tier?: number;
  } {
    const matches = ticketNumbers.filter(num => winningNumbers.includes(num));
    const matchCount = matches.length;
    
    // Tiers do Lotofácil: 15 acertos = 1º prêmio, 14 = 2º, 13 = 3º, 12 = 4º, 11 = 5º
    let tier: number | undefined;
    if (matchCount === 15) tier = 1;
    else if (matchCount === 14) tier = 2;
    else if (matchCount === 13) tier = 3;
    else if (matchCount === 12) tier = 4;
    else if (matchCount === 11) tier = 5;
    
    return {
      isWinner: tier !== undefined,
      matchCount,
      tier
    };
  }

  /**
   * Verifica vitória no SuperSete
   */
  private static checkSuperseteWinning(ticketNumbers: number[], winningNumbers: number[]): {
    isWinner: boolean;
    matchCount: number;
    tier?: number;
  } {
    let matches = 0;
    
    // No SuperSete, verificamos posição por posição
    for (let i = 0; i < Math.min(ticketNumbers.length, winningNumbers.length); i++) {
      if (ticketNumbers[i] === winningNumbers[i]) {
        matches++;
      }
    }
    
    // Tiers do SuperSete: 7 acertos = 1º prêmio, 6 = 2º, ..., 3 = 5º
    let tier: number | undefined;
    if (matches === 7) tier = 1;
    else if (matches === 6) tier = 2;
    else if (matches === 5) tier = 3;
    else if (matches === 4) tier = 4;
    else if (matches === 3) tier = 5;
    
    return {
      isWinner: tier !== undefined,
      matchCount: matches,
      tier
    };
  }
}