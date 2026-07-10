import { DEFAULT_RATE_LIMIT } from '../types/config.js';

type ResolvedRateLimit = typeof DEFAULT_RATE_LIMIT;

export class RateLimiter {
  private readonly maxConcurrent: number;
  private readonly maxPerSecond: number;
  private active = 0;
  private queue: Array<() => void> = [];
  private timestamps: number[] = [];

  constructor(config: ResolvedRateLimit) {
    this.maxConcurrent = config.maxConcurrent;
    this.maxPerSecond = config.maxPerSecond;
  }

  async acquire(): Promise<() => void> {
    await this.waitForSlot();
    this.active++;
    return () => this.release();
  }

  private async waitForSlot(): Promise<void> {
    while (this.active >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    await this.waitForRateLimit();
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < 1000);

    if (this.timestamps.length >= this.maxPerSecond) {
      const oldest = this.timestamps[0]!;
      const waitMs = 1000 - (now - oldest);
      if (waitMs > 0) {
        await sleep(waitMs);
      }
    }

    this.timestamps.push(Date.now());
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
