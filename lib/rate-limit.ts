type RateLimitRecord = {
  count: number;
  windowStart: number;
};

const requests = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function checkRateLimit(key: string) {
  const now = Date.now();
  const current = requests.get(key);

  if (!current || now - current.windowStart >= WINDOW_MS) {
    requests.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
    };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: MAX_REQUESTS - current.count,
  };
}
