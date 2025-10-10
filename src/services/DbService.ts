import { PrismaClient, Ticket as DbTicket, Draw as DbDraw } from '@prisma/client';

const prisma = new PrismaClient();

export class DbService {
  static client() {
    return prisma;
  }

  // Indexer state
  static async getLastProcessedBlock(network: string): Promise<bigint> {
    const state = await prisma.indexerState.findUnique({ where: { network } });
    return state?.lastBlock ?? 0n;
  }

  static async saveLastProcessedBlock(network: string, lastBlock: bigint): Promise<void> {
    await prisma.indexerState.upsert({
      where: { network },
      create: { network, lastBlock },
      update: { lastBlock }
    });
  }

  // Tickets
  static async upsertTicket(ticket: {
    id: string;
    owner: string;
    game: 'LOTOFACIL' | 'SUPERSETE';
    numbers: number[];
    numbersPacked: string;
    roundsBought: number;
    roundsRemaining: number;
    firstDrawId: number;
    createdAt: Date;
    expirationAt: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'REDEEMED' | 'BURNED';
    txHash: string;
    blockNumber: bigint;
  }) {
    await prisma.ticket.upsert({
      where: { id: ticket.id },
      create: ticket,
      update: ticket,
    });
  }

  static async getTicketById(id: string) {
    return prisma.ticket.findUnique({ where: { id } });
  }

  static async getTicketsByOwner(owner: string) {
    return prisma.ticket.findMany({ where: { owner: { equals: owner, mode: 'insensitive' } } });
  }

  static async getValidTicketsForDraw(drawId: number): Promise<DbTicket[]> {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) return [];
    const cutoffAt = draw.cutoffAt;
    return prisma.ticket.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: cutoffAt },
        firstDrawId: { lte: drawId },
        // drawId <= firstDrawId + roundsBought - 1
      },
    }).then((tickets: DbTicket[]) => tickets.filter((t: DbTicket) => drawId <= t.firstDrawId + t.roundsBought - 1));
  }

  // Draws
  static async upsertDraw(draw: {
    id: number;
    game: 'LOTOFACIL' | 'SUPERSETE';
    scheduledAt: Date;
    cutoffAt: Date;
    status: 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CONSOLIDATED' | 'RANDOM_REQUESTED' | 'RANDOM_FULFILLED' | 'SETTLED';
    merkleRoot?: string | null;
    totalPoolUSD?: string | null;
    randomness?: string | null;
    winningNumbers?: number[] | null;
    winningPacked?: string | null;
    ticketCount?: number;
  }) {
    await prisma.draw.upsert({
      where: { id: draw.id },
      create: draw,
      update: draw,
    });
  }

  static async updateDrawPartial(id: number, data: Partial<DbDraw>) {
    await prisma.draw.update({ where: { id }, data });
  }

  static async incrementDrawTicketCount(id: number, by: number = 1) {
    await prisma.draw.update({ where: { id }, data: { ticketCount: { increment: by } } });
  }

  // Winners
  static async upsertWinner(winner: {
    ticketId: string;
    drawId: number;
    tier: number;
    matchCount: number;
    prizeAmount: string;
    claimed?: boolean;
    claimTxHash?: string | null;
  }) {
    await prisma.winner.upsert({
      where: { ticketId_drawId: { ticketId: winner.ticketId, drawId: winner.drawId } },
      create: {
        ticketId: winner.ticketId,
        drawId: winner.drawId,
        tier: winner.tier,
        matchCount: winner.matchCount,
        prizeAmount: winner.prizeAmount,
        claimed: !!winner.claimed,
        claimTxHash: winner.claimTxHash ?? null,
      },
      update: {
        tier: winner.tier,
        matchCount: winner.matchCount,
        prizeAmount: winner.prizeAmount,
        claimed: !!winner.claimed,
        claimTxHash: winner.claimTxHash ?? null,
      },
    });
  }

  static async updateTicketStatus(id: string, status: 'ACTIVE' | 'EXPIRED' | 'REDEEMED' | 'BURNED') {
    await prisma.ticket.update({ where: { id }, data: { status } });
  }
}
