/**
 * TransactionStream Errors
 *
 * @module transaction/errors
 */
/**
 * Error thrown when transaction stream is aborted
 */
export class TransactionStreamAbortedError extends Error {
    name = "TransactionStreamAbortedError";
    constructor(message = "Transaction stream aborted") {
        super(message);
    }
}
/**
 * Error thrown when transaction tracking times out
 */
export class TransactionTimeoutError extends Error {
    name = "TransactionTimeoutError";
    txHash;
    timeoutMs;
    constructor(txHash, timeoutMs) {
        super(`Transaction ${txHash} timed out after ${timeoutMs}ms`);
        this.txHash = txHash;
        this.timeoutMs = timeoutMs;
    }
}
/**
 * Error thrown when transaction is dropped from mempool
 */
export class TransactionDroppedError extends Error {
    name = "TransactionDroppedError";
    txHash;
    reason;
    constructor(txHash, reason) {
        super(`Transaction ${txHash} was dropped: ${reason}`);
        this.txHash = txHash;
        this.reason = reason;
    }
}
