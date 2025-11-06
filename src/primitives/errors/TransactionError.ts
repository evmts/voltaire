import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base transaction error
 */
export class TransactionError extends PrimitiveError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? {
						code: options.code || "TRANSACTION_ERROR",
						context: options.context,
					}
				: { code: options?.code || "TRANSACTION_ERROR" },
		);
		this.name = "TransactionError";
	}
}

/**
 * Invalid transaction type error (e.g., unsupported transaction type)
 */
export class InvalidTransactionTypeError extends TransactionError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? {
						code: options.code || "INVALID_TRANSACTION_TYPE",
						context: options.context,
					}
				: { code: options?.code || "INVALID_TRANSACTION_TYPE" },
		);
		this.name = "InvalidTransactionTypeError";
	}
}

/**
 * Invalid signer error (e.g., signature doesn't match expected signer)
 */
export class InvalidSignerError extends TransactionError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? { code: options.code || "INVALID_SIGNER", context: options.context }
				: { code: options?.code || "INVALID_SIGNER" },
		);
		this.name = "InvalidSignerError";
	}
}
