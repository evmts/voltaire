import {
	InvalidPrivateKeyError as BaseInvalidPrivateKeyError,
	InvalidPublicKeyError as BaseInvalidPublicKeyError,
	InvalidSignatureError as BaseInvalidSignatureError,
	CryptoError,
} from "../../primitives/errors/index.js";

/**
 * Base error for secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Secp256k1Error } from './crypto/Secp256k1/index.js';
 * throw new Secp256k1Error('Secp256k1 operation failed', {
 *   code: 'SECP256K1_ERROR',
 *   context: { operation: 'sign' },
 *   docsPath: '/crypto/secp256k1#error-handling'
 * });
 * ```
 */
export class Secp256k1Error extends CryptoError {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message || "Secp256k1 operation failed", {
			code: options?.code || "SECP256K1_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/secp256k1#error-handling",
			cause: options?.cause,
		});
		this.name = "Secp256k1Error";
	}
}

/**
 * Error for invalid signatures in secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { InvalidSignatureError } from './crypto/Secp256k1/index.js';
 * throw new InvalidSignatureError('Invalid signature format', {
 *   code: 'SECP256K1_INVALID_SIGNATURE',
 *   context: { signatureLength: 63 },
 *   docsPath: '/crypto/secp256k1/verify#error-handling'
 * });
 * ```
 */
export class InvalidSignatureError extends BaseInvalidSignatureError {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message || "Invalid secp256k1 signature", {
			code: options?.code || "SECP256K1_INVALID_SIGNATURE",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/secp256k1#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error for invalid public keys in secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { InvalidPublicKeyError } from './crypto/Secp256k1/index.js';
 * throw new InvalidPublicKeyError('Invalid public key: not on curve', {
 *   code: 'SECP256K1_INVALID_PUBLIC_KEY',
 *   context: { publicKeyLength: 64 },
 *   docsPath: '/crypto/secp256k1/derive-public-key#error-handling'
 * });
 * ```
 */
export class InvalidPublicKeyError extends BaseInvalidPublicKeyError {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message || "Invalid secp256k1 public key", {
			code: options?.code || "SECP256K1_INVALID_PUBLIC_KEY",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/secp256k1#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Error for invalid private keys in secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { InvalidPrivateKeyError } from './crypto/Secp256k1/index.js';
 * throw new InvalidPrivateKeyError('Private key out of valid range', {
 *   code: 'SECP256K1_INVALID_PRIVATE_KEY',
 *   context: { privateKeyLength: 32 },
 *   docsPath: '/crypto/secp256k1/sign#error-handling'
 * });
 * ```
 */
export class InvalidPrivateKeyError extends BaseInvalidPrivateKeyError {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message || "Invalid secp256k1 private key", {
			code: options?.code || "SECP256K1_INVALID_PRIVATE_KEY",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/secp256k1#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidPrivateKeyError";
	}
}
