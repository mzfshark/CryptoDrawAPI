import { GameType } from '../types/Ticket.js';

/**
 * Utilitários para packing/unpacking de números dos jogos
 * Conforme especificação da seção 3
 */
export class NumberPacking {
  
  /**
   * Lotofácil: 15 números em 1-25 -> bitmask 25 bits
   * Cada bit representa se o número está selecionado
   */
  static packLotofacil(numbers: number[]): number {
    if (!this.validateLotofasilNumbers(numbers)) {
      throw new Error('Invalid Lotofácil numbers');
    }
    
    let packed = 0;
    for (const num of numbers) {
      // Bit position é (num - 1) porque os números são 1-25
      packed |= (1 << (num - 1));
    }
    return packed;
  }

  /**
   * Unpacking Lotofácil: converte bitmask de volta para array de números
   */
  static unpackLotofacil(packed: number): number[] {
    const numbers: number[] = [];
    for (let i = 0; i < 25; i++) {
      if (packed & (1 << i)) {
        numbers.push(i + 1);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  /**
   * SuperSete: 7 colunas 0-9 -> 28 bits (4 bits por coluna)
   * Cada coluna usa 4 bits para representar dígito 0-9
   */
  static packSupersete(columns: number[]): number {
    if (!this.validateSuperseteNumbers(columns)) {
      throw new Error('Invalid SuperSete numbers');
    }
    
    let packed = 0;
    for (let i = 0; i < 7; i++) {
      // 4 bits por coluna, shift de 4*i posições
      packed |= (columns[i] << (i * 4));
    }
    return packed;
  }

  /**
   * Unpacking SuperSete: converte de volta para array de 7 dígitos
   */
  static unpackSupersete(packed: number): number[] {
    const columns: number[] = [];
    for (let i = 0; i < 7; i++) {
      // Extrai 4 bits para cada coluna
      const digit = (packed >> (i * 4)) & 0xF; // 0xF = 15 = 1111 em binário
      columns.push(digit);
    }
    return columns;
  }

  /**
   * Validação dos números do Lotofácil
   * - Exatamente 15 números
   * - Números entre 1 e 25
   * - Sem duplicatas
   */
  static validateLotofasilNumbers(numbers: number[]): boolean {
    if (!Array.isArray(numbers) || numbers.length !== 15) {
      return false;
    }
    
    // Verifica se todos os números estão entre 1 e 25
    if (numbers.some(n => n < 1 || n > 25 || !Number.isInteger(n))) {
      return false;
    }
    
    // Verifica duplicatas
    if (new Set(numbers).size !== numbers.length) {
      return false;
    }
    
    return true;
  }

  /**
   * Validação dos números do SuperSete
   * - Exatamente 7 dígitos
   * - Dígitos entre 0 e 9
   */
  static validateSuperseteNumbers(columns: number[]): boolean {
    if (!Array.isArray(columns) || columns.length !== 7) {
      return false;
    }
    
    // Verifica se todos os dígitos estão entre 0 e 9
    if (columns.some(n => n < 0 || n > 9 || !Number.isInteger(n))) {
      return false;
    }
    
    return true;
  }

  /**
   * Função genérica para validar números baseado no tipo de jogo
   */
  static validateNumbers(numbers: number[], game: GameType): boolean {
    switch (game) {
      case GameType.LOTOFACIL:
        return this.validateLotofasilNumbers(numbers);
      case GameType.SUPERSETE:
        return this.validateSuperseteNumbers(numbers);
      default:
        return false;
    }
  }

  /**
   * Função genérica para fazer packing baseado no tipo de jogo
   */
  static packNumbers(numbers: number[], game: GameType): number {
    switch (game) {
      case GameType.LOTOFACIL:
        return this.packLotofacil(numbers);
      case GameType.SUPERSETE:
        return this.packSupersete(numbers);
      default:
        throw new Error('Unsupported game type');
    }
  }

  /**
   * Função genérica para fazer unpacking baseado no tipo de jogo
   */
  static unpackNumbers(packed: number, game: GameType): number[] {
    switch (game) {
      case GameType.LOTOFACIL:
        return this.unpackLotofacil(packed);
      case GameType.SUPERSETE:
        return this.unpackSupersete(packed);
      default:
        throw new Error('Unsupported game type');
    }
  }
}