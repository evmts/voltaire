/**
 * Fetch logs with retry logic
 *
 * @module contract/fetchLogsWithRetry
 */
import { isBlockRangeTooLargeError } from "../block/isBlockRangeTooLargeError.js";
import { sleep } from "../block/sleep.js";
import { EventStreamAbortedError } from "../stream/errors.js";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30000;
/**
 * @typedef {import('./EventStreamType.js').RetryOptions} RetryOptions
 * @typedef {import('../provider/TypedProvider.js').TypedProvider} TypedProvider
 */
/**
 * @typedef {object} FetchLogsContext
 * @property {TypedProvider} provider
 * @property {string} addressHex
 * @property {(string | null)[]} topicsHex
 */
/**
 * Fetch logs with retry logic
 * @param {FetchLogsContext} context
 * @param {bigint} fromBlock
 * @param {bigint} toBlock
 * @param {RetryOptions} [retryOptions]
 * @param {AbortSignal} [signal]
 * @returns {Promise<{logs: any[], shouldReduceChunk: boolean}>}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
export async function fetchLogsWithRetry(context, fromBlock, toBlock, retryOptions, signal) {
    const { provider, addressHex, topicsHex } = context;
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
            const logs = /** @type {any[]} */ (await provider.request(
            /** @type {*} */ ({
                method: "eth_getLogs",
                params: [
                    {
                        address: addressHex,
                        topics: topicsHex,
                        fromBlock: `0x${fromBlock.toString(16)}`,
                        toBlock: `0x${toBlock.toString(16)}`,
                    },
                ],
            })));
            return { logs, shouldReduceChunk: false };
        }
        catch (error) {
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
