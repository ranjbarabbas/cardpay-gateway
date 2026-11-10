import { db } from "../db";
import { expireOverduePendingTransactions } from "./plan-expiration.service";

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
   * Calculates an available unique payable amount across all cards and users
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

    // 1. Expire any pending transaction that has passed the 10-minute window
    await expireOverduePendingTransactions();

    // 2. Query ALL active transactions across the platform within the 20-min collision cooldown
    // This guarantees no two transactions (on the same card or different cards/users) share the same payable amount!
    const activeTransactions = await db.transaction.findMany({
      where: {
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
