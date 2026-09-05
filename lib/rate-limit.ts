import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firestore";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const ref = adminDb.collection("rateLimits").doc(key);
  const now = Date.now();

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.exists ? snapshot.data() : null;

    const windowStart =
      typeof data?.windowStart === "number" ? data.windowStart : 0;
    const count = typeof data?.count === "number" ? data.count : 0;

    if (!snapshot.exists || now - windowStart >= WINDOW_MS) {
      transaction.set(ref, {
        windowStart: now,
        count: 1,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        allowed: true,
        remaining: MAX_REQUESTS - 1,
      };
    }

    if (count >= MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
      };
    }

    transaction.update(ref, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - count - 1,
    };
  });
}
