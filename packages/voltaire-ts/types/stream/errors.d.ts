/**
 * Shared Stream Errors
 *
 * Base error classes shared between EventStream and BlockStream.
 *
 * @module stream/errors
 */
/**
 * Base class for stream abort errors
 *
 * Thrown when an AbortSignal is triggered during stream operations.
 */
export declare class StreamAbortedError extends Error {
    readonly name: string;
    constructor(message?: string);
}
/**
 * Error thrown when an EventStream operation is aborted
 *
 * This occurs when the AbortSignal passed to backfill/watch is triggered.
 */
export declare class EventStreamAbortedError extends StreamAbortedError {
    readonly name = "EventStreamAbortedError";
    constructor();
}
/**
 * Error thrown when a BlockStream operation is aborted
 *
 * This occurs when the AbortSignal passed to backfill/watch is triggered.
 */
export declare class BlockStreamAbortedError extends StreamAbortedError {
    readonly name = "BlockStreamAbortedError";
    constructor();
}
/**
 * Error thrown when RPC returns "block range too large" error
 *
 * This indicates the request exceeded the RPC provider's block range limit
 * and should be retried with a smaller range.
 */
export declare class BlockRangeTooLargeError extends Error {
    readonly fromBlock: bigint;
    readonly toBlock: bigint;
    readonly cause?: unknown | undefined;
    readonly name = "BlockRangeTooLargeError";
    constructor(fromBlock: bigint, toBlock: bigint, cause?: unknown | undefined);
}
/**
 * Error thrown when a reorg extends beyond tracked block history
 *
 * This indicates a "deep reorg" where the chain reorganization goes
 * beyond the blocks we have in memory. The consumer should restart
 * the stream from a known good block or resync from scratch.
 */
export declare class UnrecoverableReorgError extends Error {
    readonly reorgDepth: bigint;
    readonly trackedDepth: bigint;
    readonly name = "UnrecoverableReorgError";
    constructor(reorgDepth: bigint, trackedDepth: bigint);
}
//# sourceMappingURL=errors.d.ts.map