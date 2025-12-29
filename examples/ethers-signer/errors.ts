/**
 * Error codes for EthersSigner operations
 */
export const SignerErrorCode = {
	MISSING_PROVIDER: "MISSING_PROVIDER",
	INVALID_PRIVATE_KEY: "INVALID_PRIVATE_KEY",
	INVALID_TRANSACTION: "INVALID_TRANSACTION",
	INVALID_ADDRESS: "INVALID_ADDRESS",
	SIGNING_FAILED: "SIGNING_FAILED",
	TRANSACTION_REJECTED: "TRANSACTION_REJECTED",
	CHAIN_ID_MISMATCH: "CHAIN_ID_MISMATCH",
	ADDRESS_MISMATCH: "ADDRESS_MISMATCH",
	UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",
	ENS_NOT_CONFIGURED: "ENS_NOT_CONFIGURED",
} as const;

export type SignerErrorCode =
	(typeof SignerErrorCode)[keyof typeof SignerErrorCode];

/**
 * Base error class for signer operations
 */
export class SignerError extends Error {
	readonly code: SignerErrorCode;
	readonly operation?: string;
	readonly context?: Record<string, unknown>;

	constructor(
		message: string,
		options: {
			code: SignerErrorCode;
			operation?: string;
			context?: Record<string, unknown>;
			cause?: Error;
		},
	) {
		super(message, { cause: options.cause });
		this.name = "SignerError";
		this.code = options.code;
		this.operation = options.operation;
		this.context = options.context;
	}
}

/**
 * Thrown when a provider is required but not connected
 */
export class MissingProviderError extends SignerError {
	constructor(operation: string) {
		super(`Cannot ${operation} without a provider`, {
			code: SignerErrorCode.MISSING_PROVIDER,
			operation,
		});
		this.name = "MissingProviderError";
	}
}

/**
 * Thrown when private key is invalid
 */
export class InvalidPrivateKeyError extends SignerError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, {
			code: SignerErrorCode.INVALID_PRIVATE_KEY,
			context,
		});
		this.name = "InvalidPrivateKeyError";
	}
}

/**
 * Thrown when transaction is invalid
 */
export class InvalidTransactionError extends SignerError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, {
			code: SignerErrorCode.INVALID_TRANSACTION,
			context,
		});
		this.name = "InvalidTransactionError";
	}
}

/**
 * Thrown when address is invalid or mismatched
 */
export class InvalidAddressError extends SignerError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, {
			code: SignerErrorCode.INVALID_ADDRESS,
			context,
		});
		this.name = "InvalidAddressError";
	}
}

/**
 * Thrown when signing operation fails
 */
export class SigningFailedError extends SignerError {
	constructor(message: string, cause?: Error) {
		super(message, {
			code: SignerErrorCode.SIGNING_FAILED,
			cause,
		});
		this.name = "SigningFailedError";
	}
}

/**
 * Thrown when transaction from address doesn't match signer
 */
export class AddressMismatchError extends SignerError {
	constructor(expected: string, actual: string) {
		super(`Transaction from address mismatch: expected ${expected}, got ${actual}`, {
			code: SignerErrorCode.ADDRESS_MISMATCH,
			context: { expected, actual },
		});
		this.name = "AddressMismatchError";
	}
}

/**
 * Thrown when chain ID doesn't match
 */
export class ChainIdMismatchError extends SignerError {
	constructor(expected: bigint, actual: bigint) {
		super(`Chain ID mismatch: expected ${expected}, got ${actual}`, {
			code: SignerErrorCode.CHAIN_ID_MISMATCH,
			context: { expected: expected.toString(), actual: actual.toString() },
		});
		this.name = "ChainIdMismatchError";
	}
}

/**
 * Thrown when operation is not supported
 */
export class UnsupportedOperationError extends SignerError {
	constructor(operation: string, reason?: string) {
		super(reason ? `${operation}: ${reason}` : `Operation not supported: ${operation}`, {
			code: SignerErrorCode.UNSUPPORTED_OPERATION,
			operation,
		});
		this.name = "UnsupportedOperationError";
	}
}
