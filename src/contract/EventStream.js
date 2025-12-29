/**
 * EventStream Factory
 *
 * Creates EventStream instances for robust event streaming with dynamic chunking,
 * retry logic, and block height context.
 *
 * @module contract/EventStream
 */

import { Abi } from "../primitives/Abi/Abi.js";
import * as Event from "../primitives/Abi/event/index.js";
import { Address } from "../primitives/Address/index.js";
import * as BlockNumber from "../primitives/BlockNumber/index.js";
import * as Hash from "../primitives/Hash/index.js";
import * as Hex from "../primitives/Hex/index.js";
import * as TransactionHash from "../primitives/TransactionHash/index.js";
import {
	BlockRangeTooLargeError,
	EventStreamAbortedError,
} from "../stream/errors.js";

/**
 * @typedef {import('./EventStreamType.js').EventStreamConstructorOptions} EventStreamConstructorOptions
 * @typedef {import('./EventStreamType.js').EventStream} EventStreamInstance
 * @typedef {import('./EventStreamType.js').BackfillOptions} BackfillOptions
 * @typedef {import('./EventStreamType.js').WatchOptions} WatchOptions
 */

/**
 * Default options - aligned with BlockStream defaults
 */
const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_MIN_CHUNK_SIZE = 10;
const DEFAULT_POLLING_INTERVAL = 1000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30000;
const SUCCESS_STREAK_THRESHOLD = 5;
const CHUNK_INCREASE_FACTOR = 1.25;
const CHUNK_DECREASE_FACTOR = 0.5;

/**
 * Check if error indicates block range is too large
 * @param {unknown} error
 * @returns {boolean}
 */
function isBlockRangeTooLargeError(error) {
	if (!error || typeof error !== "object") return false;
	const msg =
		"message" in error && typeof error.message === "string"
			? error.message.toLowerCase()
			: "";
	const code = "code" in error ? error.code : undefined;
	return (
		msg.includes("block range") ||
		msg.includes("too large") ||
		msg.includes("limit exceeded") ||
		msg.includes("query returned more than") ||
		code === -32005
	);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an EventStream for streaming contract events.
 *
 * EventStream provides robust event streaming with:
 * - **Dynamic chunking**: Automatically adjusts chunk size based on RPC limits
 * - **Retry logic**: Exponential backoff for transient errors
 * - **Deduplication**: Tracks seen logs to avoid duplicates
 * - **AbortSignal**: Clean cancellation support
 *
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @param {import('./EventStreamType.js').EventStreamConstructorOptions<TEvent>} options
 * @returns {import('./EventStreamType.js').EventStream<TEvent>}
 *
 * @example
 * ```typescript
 * import { EventStream } from '@voltaire/contract';
 *
 * const stream = EventStream({
 *   provider,
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   event: transferEvent,
 *   filter: { from: userAddress }
 * });
 *
 * // Backfill historical events
 * for await (const { log, metadata } of stream.backfill({
 *   fromBlock: 18000000n,
 *   toBlock: 19000000n
 * })) {
 *   console.log(log.args);
 * }
 *
 * // Watch for new events
 * const controller = new AbortController();
 * for await (const { log } of stream.watch({ signal: controller.signal })) {
 *   console.log('New event:', log);
 * }
 * ```
 */
export function EventStream(options) {
	const { provider, event, filter } = options;
	const address = Address.from(options.address);
	const addressHex = Hex.fromBytes(address);

	// Encode topics from filter
	const topics = Event.encodeTopics(event, filter || {});
	const topicsHex = topics.map((t) => (t === null ? null : Hex.fromBytes(t)));

	/**
	 * Decode raw log into structured event
	 * @param {*} log
	 * @returns {import('./ContractType.js').DecodedEventLog<TEvent>}
	 */
	function decodeLog(log) {
		const dataBytes = Hex.toBytes(log.data);
		const topicBytes = log.topics.map((/** @type {string} */ t) =>
			Hex.toBytes(t),
		);
		const args = Event.decodeLog(
			event,
			dataBytes,
			/** @type {*} */ (topicBytes),
		);

		return {
			eventName: event.name,
			args,
			blockNumber: BlockNumber.from(BigInt(log.blockNumber)),
			blockHash: Hash.fromHex(log.blockHash),
			transactionHash: TransactionHash.fromHex(log.transactionHash),
			logIndex: Number.parseInt(log.logIndex, 16),
		};
	}

	/**
	 * Create unique key for log deduplication
	 * @param {*} log
	 * @returns {string}
	 */
	function getLogKey(log) {
		return `${log.blockNumber}:${log.logIndex}`;
	}

	/**
	 * Fetch logs with retry logic
	 * @param {bigint} fromBlock
	 * @param {bigint} toBlock
	 * @param {import('./EventStreamType.js').RetryOptions} [retryOptions]
	 * @param {AbortSignal} [signal]
	 * @returns {Promise<{logs: any[], shouldReduceChunk: boolean}>}
	 */
	async function fetchLogsWithRetry(fromBlock, toBlock, retryOptions, signal) {
		const maxRetries = retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES;
		const initialDelay = retryOptions?.initialDelay ?? DEFAULT_INITIAL_DELAY;
		const maxDelay = retryOptions?.maxDelay ?? DEFAULT_MAX_DELAY;

		let attempt = 0;
		let delay = initialDelay;

		while (true) {
			// Check abort before each attempt
			if (signal?.aborted) {
				throw new EventStreamAbortedError();
			}

			try {
				const logs = await provider.request({
					method: "eth_getLogs",
					params: [
						{
							address: addressHex,
							topics: topicsHex,
							fromBlock: `0x${fromBlock.toString(16)}`,
							toBlock: `0x${toBlock.toString(16)}`,
						},
					],
				});
				return { logs, shouldReduceChunk: false };
			} catch (error) {
				// Check abort after error
				if (signal?.aborted) {
					throw new EventStreamAbortedError();
				}

				// Block range too large - signal to reduce chunk size
				if (isBlockRangeTooLargeError(error)) {
					return { logs: [], shouldReduceChunk: true };
				}

				// Retry on other errors
				attempt++;
				if (attempt >= maxRetries) {
					throw error;
				}

				await sleep(delay);
				delay = Math.min(delay * 2, maxDelay);
			}
		}
	}

	/**
	 * Backfill historical events within a block range.
	 *
	 * Uses dynamic chunking to handle large ranges efficiently.
	 *
	 * @param {BackfillOptions} backfillOptions
	 * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
	 */
	async function* backfill(backfillOptions) {
		const { fromBlock, toBlock, signal, retry } = backfillOptions;
		let chunkSize = backfillOptions.chunkSize ?? DEFAULT_CHUNK_SIZE;
		const minChunkSize = backfillOptions.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE;
		const maxChunkSize = chunkSize * 2;

		// Track seen logs for deduplication
		const seen = new Set();
		let successStreak = 0;
		let currentFrom = fromBlock;

		// Get current chain head for metadata
		const chainHeadHex = await provider.request({
			method: "eth_blockNumber",
			params: [],
		});
		const chainHead = BigInt(chainHeadHex);

		while (currentFrom <= toBlock) {
			// Check abort at start of each iteration
			if (signal?.aborted) {
				throw new EventStreamAbortedError();
			}

			const currentTo =
				currentFrom + BigInt(chunkSize) - 1n > toBlock
					? toBlock
					: currentFrom + BigInt(chunkSize) - 1n;

			const { logs, shouldReduceChunk } = await fetchLogsWithRetry(
				currentFrom,
				currentTo,
				retry,
				signal,
			);

			if (shouldReduceChunk) {
				// Reduce chunk size and retry same range
				chunkSize = Math.max(
					Math.floor(chunkSize * CHUNK_DECREASE_FACTOR),
					minChunkSize,
				);
				successStreak = 0;
				continue;
			}

			// Success - maybe increase chunk size
			successStreak++;
			if (successStreak >= SUCCESS_STREAK_THRESHOLD) {
				chunkSize = Math.min(
					Math.floor(chunkSize * CHUNK_INCREASE_FACTOR),
					maxChunkSize,
				);
				successStreak = 0;
			}

			// Yield logs with deduplication
			for (const log of logs) {
				const key = getLogKey(log);
				if (seen.has(key)) continue;
				seen.add(key);

				yield {
					log: decodeLog(log),
					metadata: {
						chainHead,
						fromBlock: currentFrom,
						toBlock: currentTo,
					},
				};
			}

			// Move to next chunk
			currentFrom = currentTo + 1n;
		}
	}

	/**
	 * Watch for new events by polling.
	 *
	 * Continuously polls for new blocks and fetches matching events.
	 *
	 * @param {WatchOptions} [watchOptions]
	 * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
	 */
	async function* watch(watchOptions) {
		const signal = watchOptions?.signal;
		const pollingInterval =
			watchOptions?.pollingInterval ?? DEFAULT_POLLING_INTERVAL;
		const retry = watchOptions?.retry;

		// Check abort immediately
		if (signal?.aborted) {
			throw new EventStreamAbortedError();
		}

		// Get starting block
		let lastBlock = watchOptions?.fromBlock;
		if (lastBlock === undefined) {
			const currentBlockHex = await provider.request({
				method: "eth_blockNumber",
				params: [],
			});
			lastBlock = BigInt(currentBlockHex);
		}

		// Track seen logs for deduplication
		const seen = new Set();

		while (true) {
			// Check abort at start of each iteration
			if (signal?.aborted) {
				throw new EventStreamAbortedError();
			}

			// Get current block
			const currentBlockHex = await provider.request({
				method: "eth_blockNumber",
				params: [],
			});
			const currentBlock = BigInt(currentBlockHex);

			// Fetch logs if new blocks
			if (currentBlock > lastBlock) {
				const fromBlock = lastBlock + 1n;
				const toBlock = currentBlock;

				const { logs } = await fetchLogsWithRetry(
					fromBlock,
					toBlock,
					retry,
					signal,
				);

				for (const log of logs) {
					const key = getLogKey(log);
					if (seen.has(key)) continue;
					seen.add(key);

					yield {
						log: decodeLog(log),
						metadata: {
							chainHead: currentBlock,
							fromBlock,
							toBlock,
						},
					};
				}

				lastBlock = currentBlock;
			}

			// Check abort before sleep
			if (signal?.aborted) {
				throw new EventStreamAbortedError();
			}

			await sleep(pollingInterval);
		}
	}

	return /** @type {import('./EventStreamType.js').EventStream<TEvent>} */ ({
		backfill,
		watch,
	});
}
