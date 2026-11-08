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
  // Offset starts at +11 Tomans, then increments by +1 Toman (+11, +12, +13, ...)
  private static readonly INITIAL_OFFSET_TOMAN = 11;
  private static readonly OFFSET_INCREMENT_TOMAN = 1;
  private static readonly PAYMENT_VALIDITY_MINUTES = 10;
  private static readonly COLLISION_LOCK_MINUTES = 20;

  /**
   * Calculates an available unique payable amount for a card
   * by finding the smallest collision-free offset (+11, +12, +13, ...)
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
        status: { in: ["PENDING", "PAID", "MANUALLY_VERIFIED"] },
        collisionLockUntil: { gt: now },
      },
      select: {
        finalAmountToman: true,
      },
    });

    const occupiedAmounts = new Set<string>(
      activeTransactions.map((tx) => tx.finalAmountToman.toString())
    );

    // Find the smallest offset (11, 12, 13, ...) not currently occupied
    let currentOffset = this.INITIAL_OFFSET_TOMAN;
    let candidateFinalToman = originalAmountToman + BigInt(currentOffset);

    while (occupiedAmounts.has(candidateFinalToman.toString())) {
      currentOffset += this.OFFSET_INCREMENT_TOMAN;
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
