import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base transaction error
 */
export class TransactionError extends PrimitiveError {
	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message, { code: options?.code || "TRANSACTION_ERROR", context: options?.context });
		this.name = "TransactionError";
	}
}

/**
 * Invalid transaction type error (e.g., unsupported transaction type)
 */
export class InvalidTransactionTypeError extends TransactionError {
	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message, { code: options?.code || "INVALID_TRANSACTION_TYPE", context: options?.context });
		this.name = "InvalidTransactionTypeError";
	}
}

/**
 * Invalid signer error (e.g., signature doesn't match expected signer)
 */
export class InvalidSignerError extends TransactionError {
	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message, { code: options?.code || "INVALID_SIGNER", context: options?.context });
		this.name = "InvalidSignerError";
	}
}
