import {
	CryptoError,
	InvalidSignatureError as BaseInvalidSignatureError,
	InvalidPublicKeyError as BaseInvalidPublicKeyError,
	InvalidPrivateKeyError,
} from "../../primitives/errors/CryptoError.js";

/**
 * Base error class for Ed25519 operations
 *
 * @example
 * ```javascript
 * throw new Ed25519Error('Ed25519 operation failed', {
 *   code: 'ED25519_ERROR',
 *   context: { operation: 'sign' },
 *   docsPath: '/crypto/ed25519#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Ed25519Error extends CryptoError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "ED25519_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Ed25519Error";
	}
}

/**
 * Error thrown when signature is invalid
 *
 * @example
 * ```javascript
 * throw new InvalidSignatureError('Ed25519 signature must be 64 bytes', {
 *   code: 'ED25519_INVALID_SIGNATURE_LENGTH',
 *   context: { length: 32, expected: 64 },
 *   docsPath: '/crypto/ed25519/verify#error-handling'
 * })
 * ```
 */
export class InvalidSignatureError extends BaseInvalidSignatureError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "ED25519_INVALID_SIGNATURE",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error thrown when public key is invalid
 *
 * @example
 * ```javascript
 * throw new InvalidPublicKeyError('Ed25519 public key must be 32 bytes', {
 *   code: 'ED25519_INVALID_PUBLIC_KEY_LENGTH',
 *   context: { length: 64, expected: 32 },
 *   docsPath: '/crypto/ed25519/verify#error-handling'
 * })
 * ```
 */
export class InvalidPublicKeyError extends BaseInvalidPublicKeyError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "ED25519_INVALID_PUBLIC_KEY",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Error thrown when secret key is invalid
 *
 * @example
 * ```javascript
 * throw new InvalidSecretKeyError('Ed25519 secret key must be 32 bytes', {
 *   code: 'ED25519_INVALID_SECRET_KEY_LENGTH',
 *   context: { length: 64, expected: 32 },
 *   docsPath: '/crypto/ed25519/sign#error-handling'
 * })
 * ```
 */
export class InvalidSecretKeyError extends InvalidPrivateKeyError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "ED25519_INVALID_SECRET_KEY",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidSecretKeyError";
	}
}

/**
 * Error thrown when seed is invalid
 *
 * @example
 * ```javascript
 * throw new InvalidSeedError('Ed25519 seed must be 32 bytes', {
 *   code: 'ED25519_INVALID_SEED_LENGTH',
 *   context: { length: 16, expected: 32 },
 *   docsPath: '/crypto/ed25519/keypair-from-seed#error-handling'
 * })
 * ```
 */
export class InvalidSeedError extends Ed25519Error {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "ED25519_INVALID_SEED",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidSeedError";
	}
}
