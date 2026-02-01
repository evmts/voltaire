/**
 * @typedef {import('./BlockStreamType.js').BlockInclude} BlockInclude
 * @typedef {import('./BlockStreamType.js').RetryOptions} RetryOptions
 */

import { BlockStreamAbortedError } from "../stream/errors.js";
import { sleep } from "./sleep.js";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30000;

/**
 * Fetch a block by number with optional transactions
 * @param {*} provider - EIP-1193 provider
 * @param {bigint} blockNumber
 * @param {BlockInclude} include
 * @param {(block: *, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>} fetchBlockReceipts
 * @param {RetryOptions} [retryOptions]
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
export async function fetchBlock(
	provider,
	blockNumber,
	include,
	fetchBlockReceipts,
	retryOptions,
	signal,
) {
	const maxRetries = retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES;
	const initialDelay = retryOptions?.initialDelay ?? DEFAULT_INITIAL_DELAY;
	const maxDelay = retryOptions?.maxDelay ?? DEFAULT_MAX_DELAY;

	const includeTransactions = include !== "header";
	let attempt = 0;
	let delay = initialDelay;

	while (true) {
		if (signal?.aborted) {
			throw new BlockStreamAbortedError();
		}

		try {
			/** @type {Record<string, unknown> | null} */
			const block = await /** @type {any} */ (provider).request({
				method: "eth_getBlockByNumber",
				params: [`0x${blockNumber.toString(16)}`, includeTransactions],
			});

			if (!block) {
				throw new Error(`Block ${blockNumber} not found`);
			}

			// Fetch receipts if needed
			if (include === "receipts") {
				const receipts = await fetchBlockReceipts(block, retryOptions, signal);
				return { ...block, receipts };
			}

			return block;
		} catch (error) {
			if (signal?.aborted) {
				throw new BlockStreamAbortedError();
			}

			attempt++;
			if (attempt >= maxRetries) {
				throw error;
			}

			await sleep(delay);
			delay = Math.min(delay * 2, maxDelay);
		}
	}
}
