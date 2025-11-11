import {
	InvalidPrivateKeyError as BaseInvalidPrivateKeyError,
	InvalidPublicKeyError as BaseInvalidPublicKeyError,
	InvalidSignatureError as BaseInvalidSignatureError,
	CryptoError,
} from "../../primitives/errors/CryptoError.js";

/**
 * Base error for P256 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class P256Error extends CryptoError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "P256_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "P256Error";
	}
}

/**
 * Error for invalid signatures
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidSignatureError extends BaseInvalidSignatureError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "P256_INVALID_SIGNATURE",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error for invalid public keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidPublicKeyError extends BaseInvalidPublicKeyError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "P256_INVALID_PUBLIC_KEY",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Error for invalid private keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidPrivateKeyError extends BaseInvalidPrivateKeyError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "P256_INVALID_PRIVATE_KEY",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidPrivateKeyError";
	}
}
