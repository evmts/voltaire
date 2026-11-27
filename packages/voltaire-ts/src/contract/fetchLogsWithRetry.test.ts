import { describe, expect, it, vi } from "vitest";
import type { TypedProvider } from "../provider/TypedProvider.js";
import { EventStreamAbortedError } from "../stream/errors.js";
import { fetchLogsWithRetry } from "./fetchLogsWithRetry.js";

function makeProvider(
	handler: (args: { method: string; params?: unknown }) => Promise<unknown>,
): TypedProvider {
	return {
		request: vi.fn(handler),
		on: vi.fn(),
		removeListener: vi.fn(),
	} as unknown as TypedProvider;
}

const SAMPLE_ADDRESS = "0x1111111111111111111111111111111111111111";
const TRANSFER_TOPIC =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

describe("fetchLogsWithRetry", () => {
	it("fetches logs and formats bigint block bounds as 0x-prefixed hex", async () => {
		const sampleLog = {
			address: SAMPLE_ADDRESS,
			topics: [TRANSFER_TOPIC],
			data: "0x01",
			blockNumber: "0x10",
		};
		const provider = makeProvider(async () => [sampleLog]);

		const res = await fetchLogsWithRetry(
			{
				provider,
				addressHex: SAMPLE_ADDRESS,
				topicsHex: [TRANSFER_TOPIC, null],
			},
			16n,
			255n,
		);

		expect(res).toEqual({ logs: [sampleLog], shouldReduceChunk: false });
		expect(provider.request).toHaveBeenCalledWith({
			method: "eth_getLogs",
			params: [
				{
					address: SAMPLE_ADDRESS,
					topics: [TRANSFER_TOPIC, null],
					fromBlock: "0x10",
					toBlock: "0xff",
				},
			],
		});
	});

	it("returns shouldReduceChunk: true when provider rejects block range size", async () => {
		const errorVariants = [
			{ code: -32005, message: "query returned more than 10000 results" },
			new Error("Log response size limit exceeded"),
			new Error("block range too large"),
		];

		for (const err of errorVariants) {
			const provider = makeProvider(async () => {
				throw err;
			});

			const res = await fetchLogsWithRetry(
				{
					provider,
					addressHex: SAMPLE_ADDRESS,
					topicsHex: [TRANSFER_TOPIC],
				},
				0n,
				100_000n,
				{ maxRetries: 3, initialDelay: 1, maxDelay: 5 },
			);

			expect(res).toEqual({ logs: [], shouldReduceChunk: true });
			expect(provider.request).toHaveBeenCalledTimes(1);
		}
	});

	it("retries transient RPC failures and succeeds on a later attempt", async () => {
		let calls = 0;
		const provider = makeProvider(async () => {
			calls++;
			if (calls < 3) {
				throw new Error("temporary network timeout");
			}
			return [{ data: "0xdeadbeef" }];
		});

		const res = await fetchLogsWithRetry(
			{
				provider,
				addressHex: SAMPLE_ADDRESS,
				topicsHex: [],
			},
			100n,
			200n,
			{ maxRetries: 4, initialDelay: 1, maxDelay: 2 },
		);

		expect(calls).toBe(3);
		expect(res).toEqual({
			logs: [{ data: "0xdeadbeef" }],
			shouldReduceChunk: false,
		});
	});

	it("rethrows the underlying error after maxRetries attempts are exhausted", async () => {
		const boom = new Error("upstream node unavailable");
		const provider = makeProvider(async () => {
			throw boom;
		});

		await expect(
			fetchLogsWithRetry(
				{
					provider,
					addressHex: SAMPLE_ADDRESS,
					topicsHex: [],
				},
				1n,
				2n,
				{ maxRetries: 2, initialDelay: 1, maxDelay: 2 },
			),
		).rejects.toThrow("upstream node unavailable");
		expect(provider.request).toHaveBeenCalledTimes(2);
	});

	it("throws EventStreamAbortedError immediately if signal is already aborted", async () => {
		const controller = new AbortController();
		controller.abort();
		const provider = makeProvider(async () => []);

		await expect(
			fetchLogsWithRetry(
				{
					provider,
					addressHex: SAMPLE_ADDRESS,
					topicsHex: [],
				},
				0n,
				10n,
				{ maxRetries: 3, initialDelay: 1, maxDelay: 5 },
				controller.signal,
			),
		).rejects.toBeInstanceOf(EventStreamAbortedError);
		expect(provider.request).not.toHaveBeenCalled();
	});

	it("throws EventStreamAbortedError if signal aborts while request rejects", async () => {
		const controller = new AbortController();
		const provider = makeProvider(async () => {
			controller.abort();
			throw new Error("socket closed");
		});

		await expect(
			fetchLogsWithRetry(
				{
					provider,
					addressHex: SAMPLE_ADDRESS,
					topicsHex: [],
				},
				0n,
				10n,
				{ maxRetries: 3, initialDelay: 1, maxDelay: 5 },
				controller.signal,
			),
		).rejects.toBeInstanceOf(EventStreamAbortedError);
		expect(provider.request).toHaveBeenCalledTimes(1);
	});

	it("handles zero block number formatting and empty log arrays", async () => {
		const provider = makeProvider(async () => []);

		const res = await fetchLogsWithRetry(
			{
				provider,
				addressHex: SAMPLE_ADDRESS,
				topicsHex: [null],
			},
			0n,
			0n,
			{ maxRetries: 1, initialDelay: 1, maxDelay: 1 },
		);

		expect(res).toEqual({ logs: [], shouldReduceChunk: false });
		expect(provider.request).toHaveBeenCalledWith({
			method: "eth_getLogs",
			params: [
				{
					address: SAMPLE_ADDRESS,
					topics: [null],
					fromBlock: "0x0",
					toBlock: "0x0",
				},
			],
		});
	});
});
