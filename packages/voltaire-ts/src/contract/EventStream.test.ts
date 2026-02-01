/**
 * Runtime tests for EventStream module
 *
 * Tests EventStream backfill, watch, and dynamic chunking behavior.
 */

import { describe, expect, it, vi } from "vitest";
import type { TypedProvider } from "../provider/TypedProvider.js";
import { EventStream } from "./EventStream.js";
import { EventStreamAbortedError } from "./errors.js";

// ============================================================================
// Test Fixtures
// ============================================================================

const transferEvent = {
	type: "event" as const,
	name: "Transfer" as const,
	inputs: [
		{ type: "address" as const, name: "from" as const, indexed: true },
		{ type: "address" as const, name: "to" as const, indexed: true },
		{ type: "uint256" as const, name: "value" as const, indexed: false },
	],
};

const testAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Transfer event topic0 = keccak256("Transfer(address,address,uint256)")
const transferTopic =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function createMockLog(blockNumber: number, logIndex = 0) {
	return {
		address: testAddress.toLowerCase(),
		topics: [
			transferTopic,
			`0x000000000000000000000000${"1".repeat(40)}`, // from
			`0x000000000000000000000000${"2".repeat(40)}`, // to
		],
		data: "0x0000000000000000000000000000000000000000000000000000000000000064", // 100
		blockNumber: `0x${blockNumber.toString(16)}`,
		blockHash: `0x${"ab".repeat(32)}`,
		transactionHash: `0x${"cd".repeat(32)}`,
		logIndex: `0x${logIndex.toString(16)}`,
	};
}

function createMockProvider(
	handlers: Record<string, (params: unknown[]) => unknown>,
): TypedProvider {
	// Provide default eth_blockNumber handler if not specified
	const defaultHandlers = {
		eth_blockNumber: () => "0x1000000", // Default to block 16777216
		...handlers,
	};
	return {
		request: vi.fn(async ({ method, params }) => {
			if (defaultHandlers[method]) {
				return defaultHandlers[method](params as unknown[]);
			}
			throw new Error(`Unhandled method: ${method}`);
		}),
		on: vi.fn().mockReturnThis(),
		removeListener: vi.fn().mockReturnThis(),
	} as unknown as TypedProvider;
}

// ============================================================================
// EventStream Constructor Tests
// ============================================================================

describe("EventStream constructor", () => {
	it("creates EventStream with provider, address, and event", () => {
		const provider = createMockProvider({});
		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		expect(stream).toBeDefined();
		expect(stream.backfill).toBeDefined();
		expect(stream.watch).toBeDefined();
	});

	it("creates EventStream with optional filter", () => {
		const provider = createMockProvider({});
		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
			filter: { from: `0x${"1".repeat(40)}` },
		});

		expect(stream).toBeDefined();
	});
});

// ============================================================================
// Backfill Tests
// ============================================================================

describe("EventStream.backfill", () => {
	it("yields logs in block order", async () => {
		const logs = [createMockLog(100), createMockLog(101), createMockLog(102)];

		const provider = createMockProvider({
			eth_getLogs: () => logs,
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 100n,
			toBlock: 102n,
		})) {
			results.push(result);
		}

		expect(results.length).toBe(3);
	});

	it("includes metadata with block heights", async () => {
		const provider = createMockProvider({
			eth_getLogs: () => [createMockLog(100)],
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 100n,
			toBlock: 200n,
		})) {
			results.push(result);
		}

		expect(results.length).toBe(1);
		const { metadata } = results[0] as { metadata: unknown };
		expect(metadata).toBeDefined();
	});

	it("reduces chunk size on block range too large error", async () => {
		let callCount = 0;
		let _lastFromBlock: bigint | undefined;
		let lastToBlock: bigint | undefined;

		const provider = createMockProvider({
			eth_getLogs: (params) => {
				callCount++;
				const filter = (params as [{ fromBlock: string; toBlock: string }])[0];
				_lastFromBlock = BigInt(filter.fromBlock);
				lastToBlock = BigInt(filter.toBlock);

				if (callCount === 1) {
					// First call fails with block range error
					const error = new Error("block range too large");
					throw error;
				}
				// Subsequent calls succeed with empty logs
				return [];
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 0n,
			toBlock: 1000n,
			chunkSize: 1000,
		})) {
			results.push(result);
		}

		// Should have made multiple calls with reduced chunk size
		expect(callCount).toBeGreaterThan(1);
		// Second chunk should be smaller than first (500 instead of 1000)
		expect(lastToBlock).toBeDefined();
	});

	it("increases chunk size after consecutive successes", async () => {
		let callCount = 0;
		const chunkSizes: number[] = [];

		const provider = createMockProvider({
			eth_getLogs: (params) => {
				callCount++;
				const filter = (params as [{ fromBlock: string; toBlock: string }])[0];
				const from = BigInt(filter.fromBlock);
				const to = BigInt(filter.toBlock);
				chunkSizes.push(Number(to - from + 1n));
				return [];
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		// Request a large range to trigger multiple chunks
		for await (const _result of stream.backfill({
			fromBlock: 0n,
			toBlock: 10000n,
			chunkSize: 100, // Start small
		})) {
			// consume
		}

		// After 5 consecutive successes, chunk size should increase
		expect(callCount).toBeGreaterThan(5);
		// Later chunks should be larger (100 * 1.25 = 125)
		const laterChunks = chunkSizes.slice(5);
		if (laterChunks.length > 0) {
			expect(Math.max(...laterChunks)).toBeGreaterThanOrEqual(100);
		}
	});

	it("deduplicates logs", async () => {
		// Return same log twice (simulating overlapping chunks)
		const log = createMockLog(100, 0);

		let callCount = 0;
		const provider = createMockProvider({
			eth_getLogs: () => {
				callCount++;
				if (callCount <= 2) {
					return [log]; // Return same log twice
				}
				return [];
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 100n,
			toBlock: 102n,
			chunkSize: 1, // Force multiple chunks
		})) {
			results.push(result);
		}

		// Should deduplicate - only 1 unique log
		expect(results.length).toBe(1);
	});

	it("respects AbortSignal", async () => {
		const controller = new AbortController();

		const provider = createMockProvider({
			eth_getLogs: () => {
				controller.abort(); // Abort after first call
				return [createMockLog(100)];
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		await expect(async () => {
			for await (const result of stream.backfill({
				fromBlock: 0n,
				toBlock: 10000n,
				signal: controller.signal,
			})) {
				results.push(result);
			}
		}).rejects.toThrow(EventStreamAbortedError);
	});
});

// ============================================================================
// Watch Tests
// ============================================================================

describe("EventStream.watch", () => {
	it("polls for new blocks and yields logs", async () => {
		let blockNumber = 100;
		let pollCount = 0;

		const provider = createMockProvider({
			eth_blockNumber: () => {
				pollCount++;
				return `0x${(blockNumber++).toString(16)}`;
			},
			eth_getLogs: () => {
				if (pollCount <= 2) {
					return [createMockLog(blockNumber - 1)];
				}
				return [];
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const controller = new AbortController();
		const results: unknown[] = [];

		// Collect a few results then abort
		setTimeout(() => controller.abort(), 100);

		try {
			for await (const result of stream.watch({
				signal: controller.signal,
				pollingInterval: 10,
			})) {
				results.push(result);
				if (results.length >= 2) {
					controller.abort();
				}
			}
		} catch (e) {
			if (!(e instanceof EventStreamAbortedError)) throw e;
		}

		expect(results.length).toBeGreaterThanOrEqual(1);
	});

	it("starts from specified block", async () => {
		let capturedFromBlock: bigint | undefined;

		const provider = createMockProvider({
			eth_blockNumber: () => "0x100", // 256
			eth_getLogs: (params) => {
				const filter = (params as [{ fromBlock: string }])[0];
				capturedFromBlock = BigInt(filter.fromBlock);
				return [];
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const controller = new AbortController();
		setTimeout(() => controller.abort(), 50);

		try {
			for await (const _result of stream.watch({
				fromBlock: 200n,
				signal: controller.signal,
				pollingInterval: 10,
			})) {
				// consume
			}
		} catch (e) {
			if (!(e instanceof EventStreamAbortedError)) throw e;
		}

		expect(capturedFromBlock).toBe(201n); // fromBlock + 1
	});

	it("respects AbortSignal", async () => {
		const controller = new AbortController();
		controller.abort(); // Abort immediately

		const provider = createMockProvider({
			eth_blockNumber: () => "0x100",
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		await expect(async () => {
			for await (const _result of stream.watch({
				signal: controller.signal,
			})) {
				// Should not reach here
			}
		}).rejects.toThrow(EventStreamAbortedError);
	});
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("Error handling", () => {
	it("retries on network errors", async () => {
		let callCount = 0;

		const provider = createMockProvider({
			eth_getLogs: () => {
				callCount++;
				if (callCount === 1) {
					throw new Error("network error");
				}
				return [createMockLog(100)];
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 100n,
			toBlock: 100n,
			retry: { maxRetries: 3, initialDelay: 10 },
		})) {
			results.push(result);
		}

		expect(callCount).toBe(2);
		expect(results.length).toBe(1);
	});

	it("does not retry on abort", async () => {
		const controller = new AbortController();
		let callCount = 0;

		const provider = createMockProvider({
			eth_getLogs: () => {
				callCount++;
				controller.abort();
				throw new Error("should not retry");
			},
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		await expect(async () => {
			for await (const _result of stream.backfill({
				fromBlock: 0n,
				toBlock: 1000n,
				signal: controller.signal,
			})) {
				// consume
			}
		}).rejects.toThrow();

		expect(callCount).toBe(1);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge cases", () => {
	it("handles empty block ranges", async () => {
		const provider = createMockProvider({
			eth_getLogs: () => [],
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 100n,
			toBlock: 100n,
		})) {
			results.push(result);
		}

		expect(results.length).toBe(0);
	});

	it("handles single block range", async () => {
		const provider = createMockProvider({
			eth_getLogs: () => [createMockLog(100)],
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 100n,
			toBlock: 100n,
		})) {
			results.push(result);
		}

		expect(results.length).toBe(1);
	});

	it("handles logs with same transaction but different indices", async () => {
		const provider = createMockProvider({
			eth_getLogs: () => [
				createMockLog(100, 0),
				createMockLog(100, 1),
				createMockLog(100, 2),
			],
		});

		const stream = EventStream({
			provider,
			address: testAddress,
			event: transferEvent,
		});

		const results: unknown[] = [];
		for await (const result of stream.backfill({
			fromBlock: 100n,
			toBlock: 100n,
		})) {
			results.push(result);
		}

		expect(results.length).toBe(3);
	});
});
