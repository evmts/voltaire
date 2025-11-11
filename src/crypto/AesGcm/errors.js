// @ts-nocheck
/**
 * Base error for AES-GCM operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} message - Error message
 * @throws {never}
 * @example
 * ```javascript
 * import { AesGcmError } from './crypto/AesGcm/index.js';
 * throw new AesGcmError('Operation failed');
 * ```
 */
export class AesGcmError extends Error {
	constructor(message) {
		super(message);
		this.name = "AesGcmError";
	}
}

/**
 * Invalid key error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} message - Error message
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidKeyError } from './crypto/AesGcm/index.js';
 * throw new InvalidKeyError('Invalid key size');
 * ```
 */
export class InvalidKeyError extends AesGcmError {
	constructor(message) {
		super(message);
		this.name = "InvalidKeyError";
	}
}

/**
 * Invalid nonce error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} message - Error message
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidNonceError } from './crypto/AesGcm/index.js';
 * throw new InvalidNonceError('Nonce must be 12 bytes');
 * ```
 */
export class InvalidNonceError extends AesGcmError {
	constructor(message) {
		super(message);
		this.name = "InvalidNonceError";
	}
}

/**
 * Decryption failure error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} message - Error message
 * @throws {never}
 * @example
 * ```javascript
 * import { DecryptionError } from './crypto/AesGcm/index.js';
 * throw new DecryptionError('Authentication failed');
 * ```
 */
export class DecryptionError extends AesGcmError {
	constructor(message) {
		super(message);
		this.name = "DecryptionError";
	}
}
