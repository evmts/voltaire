/**
 * Watch for new events by polling
 *
 * @module contract/watchEvents
 */

import { sleep } from "../block/sleep.js";
import { EventStreamAbortedError } from "../stream/errors.js";
import { fetchLogsWithRetry } from "./fetchLogsWithRetry.js";

const DEFAULT_POLLING_INTERVAL = 1000;

/**
 * @typedef {import('./EventStreamType.js').WatchOptions} WatchOptions
 * @typedef {import('../provider/TypedProvider.js').TypedProvider} TypedProvider
 */

/**
 * @typedef {object} WatchContext
 * @property {TypedProvider} provider
 * @property {string} addressHex
 * @property {(string | null)[]} topicsHex
 * @property {(log: any) => import('./EventStreamType.js').DecodedEventLog<any>} decodeLog
 * @property {(log: any) => string} getLogKey
 */

/**
 * Watch for new events by polling.
 *
 * Continuously polls for new blocks and fetches matching events.
 *
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @param {WatchContext} context
 * @param {WatchOptions} [watchOptions]
 * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming logic
export async function* watchEvents(context, watchOptions) {
	const { provider, addressHex, topicsHex, decodeLog, getLogKey } = context;
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
		const currentBlockHex = /** @type {string} */ (
			await provider.request(
				/** @type {*} */ ({
					method: "eth_blockNumber",
					params: [],
				}),
			)
		);
		lastBlock = BigInt(currentBlockHex);
	}

	// Track seen logs for deduplication
	const seen = new Set();
	const fetchContext = { provider, addressHex, topicsHex };

	while (true) {
		// Check abort at start of each iteration
		if (signal?.aborted) {
			throw new EventStreamAbortedError();
		}

		// Get current block
		const currentBlockHex = /** @type {string} */ (
			await provider.request(
				/** @type {*} */ ({
					method: "eth_blockNumber",
					params: [],
				}),
			)
		);
		const currentBlock = BigInt(currentBlockHex);

		// Fetch logs if new blocks
		if (currentBlock > lastBlock) {
			const fromBlock = lastBlock + 1n;
			const toBlock = currentBlock;

			const { logs } = await fetchLogsWithRetry(
				fetchContext,
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
