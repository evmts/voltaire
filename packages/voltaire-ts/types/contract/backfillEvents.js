/**
 * Backfill historical events within a block range
 *
 * @module contract/backfillEvents
 */
import { EventStreamAbortedError } from "../stream/errors.js";
import { fetchLogsWithRetry } from "./fetchLogsWithRetry.js";
const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_MIN_CHUNK_SIZE = 10;
const SUCCESS_STREAK_THRESHOLD = 5;
const CHUNK_INCREASE_FACTOR = 1.25;
const CHUNK_DECREASE_FACTOR = 0.5;
/**
 * @typedef {import('./EventStreamType.js').BackfillOptions} BackfillOptions
 * @typedef {import('../provider/TypedProvider.js').TypedProvider} TypedProvider
 */
/**
 * @typedef {object} BackfillContext
 * @property {TypedProvider} provider
 * @property {string} addressHex
 * @property {(string | null)[]} topicsHex
 * @property {(log: any) => import('./EventStreamType.js').DecodedEventLog<any>} decodeLog
 * @property {(log: any) => string} getLogKey
 */
/**
 * Backfill historical events within a block range.
 *
 * Uses dynamic chunking to handle large ranges efficiently.
 *
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @param {BackfillContext} context
 * @param {BackfillOptions} backfillOptions
 * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming logic
export async function* backfillEvents(context, backfillOptions) {
    const { provider, addressHex, topicsHex, decodeLog, getLogKey } = context;
    const { fromBlock, toBlock, signal, retry } = backfillOptions;
    let chunkSize = backfillOptions.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const minChunkSize = backfillOptions.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE;
    const maxChunkSize = chunkSize * 2;
    // Track seen logs for deduplication
    const seen = new Set();
    let successStreak = 0;
    let currentFrom = fromBlock;
    // Get current chain head for metadata
    const chainHeadHex = /** @type {string} */ (await provider.request(
    /** @type {*} */ ({
        method: "eth_blockNumber",
        params: [],
    })));
    const chainHead = BigInt(chainHeadHex);
    const fetchContext = { provider, addressHex, topicsHex };
    while (currentFrom <= toBlock) {
        // Check abort at start of each iteration
        if (signal?.aborted) {
            throw new EventStreamAbortedError();
        }
        const currentTo = currentFrom + BigInt(chunkSize) - 1n > toBlock
            ? toBlock
            : currentFrom + BigInt(chunkSize) - 1n;
        const { logs, shouldReduceChunk } = await fetchLogsWithRetry(fetchContext, currentFrom, currentTo, retry, signal);
        if (shouldReduceChunk) {
            // Reduce chunk size and retry same range
            chunkSize = Math.max(Math.floor(chunkSize * CHUNK_DECREASE_FACTOR), minChunkSize);
            successStreak = 0;
            continue;
        }
        // Success - maybe increase chunk size
        successStreak++;
        if (successStreak >= SUCCESS_STREAK_THRESHOLD) {
            chunkSize = Math.min(Math.floor(chunkSize * CHUNK_INCREASE_FACTOR), maxChunkSize);
            successStreak = 0;
        }
        // Yield logs with deduplication
        for (const log of logs) {
            const key = getLogKey(log);
            if (seen.has(key))
                continue;
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
