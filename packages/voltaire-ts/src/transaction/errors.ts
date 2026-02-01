/**
 * TransactionStream Errors
 *
 * @module transaction/errors
 */

/**
 * Error thrown when transaction stream is aborted
 */
export class TransactionStreamAbortedError extends Error {
	override readonly name = "TransactionStreamAbortedError";

	constructor(message = "Transaction stream aborted") {
		super(message);
	}
}

/**
 * Error thrown when transaction tracking times out
 */
export class TransactionTimeoutError extends Error {
	override readonly name = "TransactionTimeoutError";
	readonly txHash: string;
	readonly timeoutMs: number;

	constructor(txHash: string, timeoutMs: number) {
		super(`Transaction ${txHash} timed out after ${timeoutMs}ms`);
		this.txHash = txHash;
		this.timeoutMs = timeoutMs;
	}
}

/**
 * Error thrown when transaction is dropped from mempool
 */
export class TransactionDroppedError extends Error {
	override readonly name = "TransactionDroppedError";
	readonly txHash: string;
	readonly reason: "replaced" | "timeout" | "underpriced" | "unknown";

	constructor(
		txHash: string,
		reason: "replaced" | "timeout" | "underpriced" | "unknown",
	) {
		super(`Transaction ${txHash} was dropped: ${reason}`);
		this.txHash = txHash;
		this.reason = reason;
	}
}
