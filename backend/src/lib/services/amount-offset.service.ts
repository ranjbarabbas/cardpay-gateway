import { db } from "../db";

export interface ResolvedAmount {
  originalAmountToman: bigint;
  offsetToman: number;
  finalAmountToman: bigint;
  finalAmountRial: bigint;
  expiresAt: Date;
  collisionLockUntil: Date;
}

export class AmountOffsetService {
  private static readonly OFFSET_STEP_TOMAN = 5;
  private static readonly PAYMENT_VALIDITY_MINUTES = 10;
  private static readonly COLLISION_LOCK_MINUTES = 20;

  /**
   * Calculates an available unique payable amount for a card
   * by finding the smallest collision-free offset (+0, +5, +10, ...)
   * within the 20-minute cooldown window.
   */
  public static async resolveUniqueAmount(
    cardId: string,
    baseAmountToman: bigint | number
  ): Promise<ResolvedAmount> {
    const originalAmountToman = BigInt(baseAmountToman);
    const now = new Date();

    const expiresAt = new Date(now.getTime() + this.PAYMENT_VALIDITY_MINUTES * 60 * 1000);
    const collisionLockUntil = new Date(now.getTime() + this.COLLISION_LOCK_MINUTES * 60 * 1000);

    // Query active transactions on this card that haven't passed the 20-min collision cooldown
    const activeTransactions = await db.transaction.findMany({
      where: {
        cardId,
        status: { in: ["PENDING", "PAID"] },
        collisionLockUntil: { gt: now },
      },
      select: {
        finalAmountToman: true,
      },
    });

    const occupiedAmounts = new Set<string>(
      activeTransactions.map((tx) => tx.finalAmountToman.toString())
    );

    // Find the smallest offset (0, 5, 10, 15, ...) not currently occupied
    let currentOffset = 0;
    let candidateFinalToman = originalAmountToman;

    while (occupiedAmounts.has(candidateFinalToman.toString())) {
      currentOffset += this.OFFSET_STEP_TOMAN;
      candidateFinalToman = originalAmountToman + BigInt(currentOffset);
    }

    const finalAmountRial = candidateFinalToman * BigInt(10);

    return {
      originalAmountToman,
      offsetToman: currentOffset,
      finalAmountToman: candidateFinalToman,
      finalAmountRial,
      expiresAt,
      collisionLockUntil,
    };
  }
}
