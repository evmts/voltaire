/**
 * TransactionStream Errors
 *
 * @module transaction/errors
 */
/**
 * Error thrown when transaction stream is aborted
 */
export declare class TransactionStreamAbortedError extends Error {
    readonly name = "TransactionStreamAbortedError";
    constructor(message?: string);
}
/**
 * Error thrown when transaction tracking times out
 */
export declare class TransactionTimeoutError extends Error {
    readonly name = "TransactionTimeoutError";
    readonly txHash: string;
    readonly timeoutMs: number;
    constructor(txHash: string, timeoutMs: number);
}
/**
 * Error thrown when transaction is dropped from mempool
 */
export declare class TransactionDroppedError extends Error {
    readonly name = "TransactionDroppedError";
    readonly txHash: string;
    readonly reason: "replaced" | "timeout" | "underpriced" | "unknown";
    constructor(txHash: string, reason: "replaced" | "timeout" | "underpriced" | "unknown");
}
//# sourceMappingURL=errors.d.ts.map