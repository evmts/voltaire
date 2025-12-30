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
export class StreamAbortedError extends Error {
	override readonly name: string = "StreamAbortedError";

	constructor(message = "Stream was aborted") {
		super(message);
	}
}

/**
 * Error thrown when an EventStream operation is aborted
 *
 * This occurs when the AbortSignal passed to backfill/watch is triggered.
 */
export class EventStreamAbortedError extends StreamAbortedError {
	override readonly name = "EventStreamAbortedError";

	constructor() {
		super("Event stream was aborted");
	}
}

/**
 * Error thrown when a BlockStream operation is aborted
 *
 * This occurs when the AbortSignal passed to backfill/watch is triggered.
 */
export class BlockStreamAbortedError extends StreamAbortedError {
	override readonly name = "BlockStreamAbortedError";

	constructor() {
		super("Block stream was aborted");
	}
}

/**
 * Error thrown when RPC returns "block range too large" error
 *
 * This indicates the request exceeded the RPC provider's block range limit
 * and should be retried with a smaller range.
 */
export class BlockRangeTooLargeError extends Error {
	override readonly name = "BlockRangeTooLargeError";

	constructor(
		public readonly fromBlock: bigint,
		public readonly toBlock: bigint,
		public override readonly cause?: unknown,
	) {
		super(`Block range too large: ${fromBlock} to ${toBlock}`);
	}
}

/**
 * Error thrown when a reorg extends beyond tracked block history
 *
 * This indicates a "deep reorg" where the chain reorganization goes
 * beyond the blocks we have in memory. The consumer should restart
 * the stream from a known good block or resync from scratch.
 */
export class UnrecoverableReorgError extends Error {
	override readonly name = "UnrecoverableReorgError";

	constructor(
		public readonly reorgDepth: bigint,
		public readonly trackedDepth: bigint,
	) {
		super(
			`Unrecoverable reorg: depth ${reorgDepth} exceeds tracked history of ${trackedDepth} blocks`,
		);
	}
}
