// @ts-nocheck
/**
 * Base error for AES-GCM operations
 * @param {string} message - Error message
 */
export class AesGcmError extends Error {
	constructor(message) {
		super(message);
		this.name = "AesGcmError";
	}
}

/**
 * Invalid key error
 * @param {string} message - Error message
 */
export class InvalidKeyError extends AesGcmError {
	constructor(message) {
		super(message);
		this.name = "InvalidKeyError";
	}
}

/**
 * Invalid nonce error
 * @param {string} message - Error message
 */
export class InvalidNonceError extends AesGcmError {
	constructor(message) {
		super(message);
		this.name = "InvalidNonceError";
	}
}

/**
 * Decryption failure error
 * @param {string} message - Error message
 */
export class DecryptionError extends AesGcmError {
	constructor(message) {
		super(message);
		this.name = "DecryptionError";
	}
}
