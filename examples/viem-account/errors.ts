/**
 * Custom errors for viem-account
 */

/**
 * Base error class for account errors
 */
export class AccountError extends Error {
	readonly code: string;
	readonly docsPath?: string;

	constructor(
		message: string,
		options?: { code?: string; docsPath?: string; cause?: Error },
	) {
		super(message, { cause: options?.cause });
		this.name = "AccountError";
		this.code = options?.code ?? "ACCOUNT_ERROR";
		this.docsPath = options?.docsPath;
	}
}

/**
 * Error thrown when address validation fails
 */
export class InvalidAddressError extends AccountError {
	readonly address: string;

	constructor(
		message: string,
		options?: { address: string; code?: string; docsPath?: string },
	) {
		super(message, {
			code: options?.code ?? "INVALID_ADDRESS",
			docsPath: options?.docsPath ?? "/primitives/address#validation",
		});
		this.name = "InvalidAddressError";
		this.address = options?.address ?? "";
	}
}

/**
 * Error thrown when private key validation fails
 */
export class InvalidPrivateKeyError extends AccountError {
	constructor(
		message: string,
		options?: { code?: string; docsPath?: string; cause?: Error },
	) {
		super(message, {
			code: options?.code ?? "INVALID_PRIVATE_KEY",
			docsPath: options?.docsPath ?? "/crypto/secp256k1#private-keys",
			cause: options?.cause,
		});
		this.name = "InvalidPrivateKeyError";
	}
}

/**
 * Error thrown when signing fails
 */
export class SigningError extends AccountError {
	constructor(
		message: string,
		options?: { code?: string; docsPath?: string; cause?: Error },
	) {
		super(message, {
			code: options?.code ?? "SIGNING_FAILED",
			docsPath: options?.docsPath ?? "/crypto/secp256k1#signing",
			cause: options?.cause,
		});
		this.name = "SigningError";
	}
}

/**
 * Error thrown when message format is invalid
 */
export class InvalidMessageError extends AccountError {
	constructor(message: string, options?: { code?: string; docsPath?: string }) {
		super(message, {
			code: options?.code ?? "INVALID_MESSAGE",
			docsPath: options?.docsPath ?? "/crypto/eip191#message-format",
		});
		this.name = "InvalidMessageError";
	}
}

/**
 * Error thrown when typed data is invalid
 */
export class InvalidTypedDataError extends AccountError {
	constructor(message: string, options?: { code?: string; docsPath?: string }) {
		super(message, {
			code: options?.code ?? "INVALID_TYPED_DATA",
			docsPath: options?.docsPath ?? "/crypto/eip712#typed-data",
		});
		this.name = "InvalidTypedDataError";
	}
}
