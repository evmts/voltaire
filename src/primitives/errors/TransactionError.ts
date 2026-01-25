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
export class TransactionError extends PrimitiveError {
	override readonly _tag: string = "TransactionError";
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "TransactionError";
	}
}

/**
 * Invalid transaction type error (e.g., unsupported transaction type)
 *
 * @throws {InvalidTransactionTypeError}
 */
export class InvalidTransactionTypeError extends TransactionError {
	override readonly _tag: string = "InvalidTransactionTypeError";
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidTransactionTypeError";
	}
}

/**
 * Invalid signer error (e.g., signature doesn't match expected signer)
 *
 * @throws {InvalidSignerError}
 */
export class InvalidSignerError extends TransactionError {
	override readonly _tag: string = "InvalidSignerError";
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidSignerError";
	}
}
