import { CryptoError } from "../../primitives/errors/index.js";

/**
 * Base error for Keystore operations (Web3 Secret Storage v3)
 *
 * @see https://voltaire.tevm.sh/crypto/keystore for Keystore documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * throw new KeystoreError('Keystore operation failed', {
 *   code: 'KEYSTORE_ERROR',
 *   context: { operation: 'decrypt' },
 *   docsPath: '/crypto/keystore#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class KeystoreError extends CryptoError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Keystore operation failed", {
			code: options?.code || "KEYSTORE_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/keystore#error-handling",
			cause: options?.cause,
		});
		this.name = "KeystoreError";
	}
}

/**
 * Error thrown when MAC verification fails
 *
 * Indicates wrong password or corrupted keystore data.
 *
 * @see https://voltaire.tevm.sh/crypto/keystore/decrypt
 * @since 0.0.0
 */
export class InvalidMacError extends KeystoreError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(
		message = "MAC verification failed - invalid password or corrupted keystore",
		options,
	) {
		super(message, {
			code: options?.code || "INVALID_MAC",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/keystore/decrypt#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidMacError";
	}
}

/**
 * Error thrown when keystore version is unsupported
 *
 * Only Web3 Secret Storage v3 is supported.
 *
 * @see https://voltaire.tevm.sh/crypto/keystore/decrypt
 * @since 0.0.0
 */
export class UnsupportedVersionError extends KeystoreError {
	/** @type {unknown} */
	version;

	/**
	 * @param {unknown} version
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(version, options) {
		super(
			`Unsupported keystore version: ${version}. Only version 3 is supported.`,
			{
				code: options?.code || "UNSUPPORTED_VERSION",
				context: { version, ...options?.context },
				docsPath:
					options?.docsPath || "/crypto/keystore/decrypt#error-handling",
				cause: options?.cause,
			},
		);
		this.name = "UnsupportedVersionError";
		this.version = version;
	}
}

/**
 * Error thrown when KDF is unsupported
 *
 * Only 'scrypt' and 'pbkdf2' key derivation functions are supported.
 *
 * @see https://voltaire.tevm.sh/crypto/keystore/decrypt
 * @since 0.0.0
 */
export class UnsupportedKdfError extends KeystoreError {
	/** @type {unknown} */
	kdf;

	/**
	 * @param {unknown} kdf
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(kdf, options) {
		super(
			`Unsupported KDF: ${kdf}. Only 'scrypt' and 'pbkdf2' are supported.`,
			{
				code: options?.code || "UNSUPPORTED_KDF",
				context: { kdf, ...options?.context },
				docsPath:
					options?.docsPath || "/crypto/keystore/decrypt#error-handling",
				cause: options?.cause,
			},
		);
		this.name = "UnsupportedKdfError";
		this.kdf = kdf;
	}
}

/**
 * Error thrown when decryption fails
 *
 * @see https://voltaire.tevm.sh/crypto/keystore/decrypt
 * @since 0.0.0
 */
export class DecryptionError extends KeystoreError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message = "Decryption failed", options) {
		super(message, {
			code: options?.code || "DECRYPTION_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/keystore/decrypt#error-handling",
			cause: options?.cause,
		});
		this.name = "DecryptionError";
	}
}

/**
 * Error thrown when encryption fails
 *
 * @see https://voltaire.tevm.sh/crypto/keystore/encrypt
 * @since 0.0.0
 */
export class EncryptionError extends KeystoreError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message = "Encryption failed", options) {
		super(message, {
			code: options?.code || "ENCRYPTION_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/keystore/encrypt#error-handling",
			cause: options?.cause,
		});
		this.name = "EncryptionError";
	}
}
