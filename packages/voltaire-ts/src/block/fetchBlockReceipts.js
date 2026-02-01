/**
 * @typedef {import('./BlockStreamType.js').RetryOptions} RetryOptions
 */

import { BlockStreamAbortedError } from "../stream/errors.js";
import { sleep } from "./sleep.js";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30000;

/**
 * Create a fetchBlockReceipts function with memoized support state
 * @param {*} provider - EIP-1193 provider
 * @returns {(block: *, retryOptions?: RetryOptions, signal?: AbortSignal) => Promise<any[]>}
 */
export function createFetchBlockReceipts(provider) {
	// Track whether eth_getBlockReceipts is supported
	let isBlockReceiptsSupported = true;

	/**
	 * Fetch receipts for a block with fallback to individual receipt fetching
	 * @param {*} block
	 * @param {RetryOptions} [retryOptions]
	 * @param {AbortSignal} [signal]
	 * @returns {Promise<any[]>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
	async function fetchBlockReceipts(block, retryOptions, signal) {
		const maxRetries = retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES;
		const initialDelay = retryOptions?.initialDelay ?? DEFAULT_INITIAL_DELAY;
		const maxDelay = retryOptions?.maxDelay ?? DEFAULT_MAX_DELAY;

		// Try eth_getBlockReceipts first if supported
		if (isBlockReceiptsSupported) {
			let attempt = 0;
			let delay = initialDelay;

			while (attempt < maxRetries) {
				if (signal?.aborted) {
					throw new BlockStreamAbortedError();
				}

				try {
					const receipts = await /** @type {any} */ (provider).request({
						method: "eth_getBlockReceipts",
						params: [block.hash],
					});
					return receipts ?? [];
				} catch (error) {
					if (signal?.aborted) {
						throw new BlockStreamAbortedError();
					}

					// Check if method is not supported
					const errorMsg =
						error instanceof Error ? error.message.toLowerCase() : "";
					if (
						errorMsg.includes("method not found") ||
						errorMsg.includes("not supported") ||
						errorMsg.includes("unknown method")
					) {
						isBlockReceiptsSupported = false;
						break;
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

		// Fallback: fetch individual receipts
		const transactions = block.body?.transactions ?? block.transactions ?? [];
		/** @type {Promise<any>[]} */
		const receipts = await Promise.all(
			// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
			transactions.map(async (/** @type {any} */ tx) => {
				const txHash = typeof tx === "string" ? tx : tx.hash;
				let attempt = 0;
				let delay = initialDelay;

				while (true) {
					if (signal?.aborted) {
						throw new BlockStreamAbortedError();
					}

					try {
						const receipt = await /** @type {any} */ (provider).request({
							method: "eth_getTransactionReceipt",
							params: [txHash],
						});
						return receipt;
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
			}),
		);

		return receipts.filter(Boolean);
	}

	return fetchBlockReceipts;
}
