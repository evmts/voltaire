// @ts-nocheck
import { CryptoError } from "../../primitives/errors/CryptoError.js";

/**
 * Base error for ChaCha20-Poly1305 operations
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { ChaCha20Poly1305Error } from './crypto/ChaCha20Poly1305/index.js';
 * throw new ChaCha20Poly1305Error('Operation failed', {
 *   code: 'CHACHA20_POLY1305_ERROR',
 *   context: { operation: 'encrypt' },
 *   docsPath: '/crypto/chacha20poly1305#error-handling',
 *   cause: originalError
 * });
 * ```
 */
export class ChaCha20Poly1305Error extends CryptoError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "CHACHA20_POLY1305_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "ChaCha20Poly1305Error";
	}
}

/**
 * Invalid key error
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidKeyError } from './crypto/ChaCha20Poly1305/index.js';
 * throw new InvalidKeyError('Invalid key size', {
 *   code: 'CHACHA20_POLY1305_INVALID_KEY_SIZE',
 *   context: { size: 16, expected: 32 },
 *   docsPath: '/crypto/chacha20poly1305#error-handling'
 * });
 * ```
 */
export class InvalidKeyError extends ChaCha20Poly1305Error {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "CHACHA20_POLY1305_INVALID_KEY",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidKeyError";
	}
}

/**
 * Invalid nonce error
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidNonceError } from './crypto/ChaCha20Poly1305/index.js';
 * throw new InvalidNonceError('Nonce must be 12 bytes', {
 *   code: 'CHACHA20_POLY1305_INVALID_NONCE_LENGTH',
 *   context: { length: 8, expected: 12 },
 *   docsPath: '/crypto/chacha20poly1305#error-handling'
 * });
 * ```
 */
export class InvalidNonceError extends ChaCha20Poly1305Error {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "CHACHA20_POLY1305_INVALID_NONCE",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidNonceError";
	}
}

/**
 * Decryption failure error
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { DecryptionError } from './crypto/ChaCha20Poly1305/index.js';
 * throw new DecryptionError('Authentication failed', {
 *   code: 'CHACHA20_POLY1305_DECRYPTION_FAILED',
 *   context: { operation: 'decrypt' },
 *   docsPath: '/crypto/chacha20poly1305#error-handling',
 *   cause: originalError
 * });
 * ```
 */
export class DecryptionError extends ChaCha20Poly1305Error {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "CHACHA20_POLY1305_DECRYPTION_FAILED",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "DecryptionError";
	}
}
