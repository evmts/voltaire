// @ts-nocheck
import { CryptoError } from "../../primitives/errors/CryptoError.js";

/**
 * Base error for AES-GCM operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { AesGcmError } from './crypto/AesGcm/index.js';
 * throw new AesGcmError('Operation failed', {
 *   code: 'AES_GCM_ERROR',
 *   context: { operation: 'encrypt' },
 *   docsPath: '/crypto/aes-gcm#error-handling',
 *   cause: originalError
 * });
 * ```
 */
export class AesGcmError extends CryptoError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "AES_GCM_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "AesGcmError";
	}
}

/**
 * Invalid key error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidKeyError } from './crypto/AesGcm/index.js';
 * throw new InvalidKeyError('Invalid key size', {
 *   code: 'AES_GCM_INVALID_KEY_SIZE',
 *   context: { size: 16, expected: '16, 24, or 32 bytes' },
 *   docsPath: '/crypto/aes-gcm/import-key#error-handling'
 * });
 * ```
 */
export class InvalidKeyError extends AesGcmError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "AES_GCM_INVALID_KEY",
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
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidNonceError } from './crypto/AesGcm/index.js';
 * throw new InvalidNonceError('Nonce must be 12 bytes', {
 *   code: 'AES_GCM_INVALID_NONCE_LENGTH',
 *   context: { length: 8, expected: 12 },
 *   docsPath: '/crypto/aes-gcm/encrypt#error-handling'
 * });
 * ```
 */
export class InvalidNonceError extends AesGcmError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "AES_GCM_INVALID_NONCE",
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
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { DecryptionError } from './crypto/AesGcm/index.js';
 * throw new DecryptionError('Authentication failed', {
 *   code: 'AES_GCM_DECRYPTION_FAILED',
 *   context: { operation: 'decrypt' },
 *   docsPath: '/crypto/aes-gcm/decrypt#error-handling',
 *   cause: originalError
 * });
 * ```
 */
export class DecryptionError extends AesGcmError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "AES_GCM_DECRYPTION_FAILED",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "DecryptionError";
	}
}
