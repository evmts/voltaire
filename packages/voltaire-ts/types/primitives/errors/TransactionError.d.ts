import { PrimitiveError } from "./PrimitiveError.js";
/**
 * Base transaction error
 *
 * @example
 * ```typescript
 * throw new TransactionError('Transaction processing failed', {
 *   code: 'TRANSACTION_ERROR',
 *   context: { txType: '0x02' },
 *   docsPath: '/primitives/transaction/overview#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export declare class TransactionError extends PrimitiveError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid transaction type error (e.g., unsupported transaction type)
 *
 * @throws {InvalidTransactionTypeError}
 */
export declare class InvalidTransactionTypeError extends TransactionError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid signer error (e.g., signature doesn't match expected signer)
 *
 * @throws {InvalidSignerError}
 */
export declare class InvalidSignerError extends TransactionError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=TransactionError.d.ts.map