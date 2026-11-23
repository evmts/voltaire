import { runBenchSuite } from "../bench-harness.js";
import { BatchQueue } from "./batch.js";
import { RateLimiter, throttle } from "./rateLimit.js";
import { retryWithBackoff } from "./retryWithBackoff.js";
import { withTimeout } from "./timeout.js";

const throttled = throttle((x: number) => x * 2, 10_000);
const limiter = new RateLimiter({ maxRequests: 1_000_000, interval: 1000 });

await runBenchSuite("voltaire-ts:utils", [
	{ name: "throttle (suppressed fast-path)", fn: () => throttled(21) },
	{ name: "RateLimiter.execute", fn: () => limiter.execute(async () => 42) },
	{
		name: "BatchQueue.create",
		fn: () =>
			new BatchQueue<number, number>({
				maxBatchSize: 16,
				maxWaitTime: 10,
				processBatch: async (items) => items.map((x) => x * 2),
			}),
	},
	{
		name: "retryWithBackoff (immediate success)",
		fn: () =>
			retryWithBackoff(async () => 42, { maxRetries: 2, initialDelay: 1 }),
	},
	{
		name: "withTimeout (immediate resolve)",
		fn: () => withTimeout(Promise.resolve(42), { timeoutMs: 1000 }),
	},
]);
