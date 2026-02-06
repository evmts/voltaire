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
     * @override
     * @readonly
     * @type {string}
     */
    _tag = "KeystoreError";
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message, options) {
        super(message || "Keystore operation failed", {
            code: options?.code ?? -32000,
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
    /** @override @readonly */
    _tag = "InvalidMacError";
    /**
     * @param {string} [message]
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message = "MAC verification failed - invalid password or corrupted keystore", options) {
        super(message, {
            code: options?.code ?? -32000,
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
    /** @override @readonly */
    _tag = "UnsupportedVersionError";
    /** @type {unknown} */
    version;
    /**
     * @param {unknown} version
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(version, options) {
        super(`Unsupported keystore version: ${version}. Only version 3 is supported.`, {
            code: options?.code ?? -32602,
            context: { version, ...options?.context },
            docsPath: options?.docsPath || "/crypto/keystore/decrypt#error-handling",
            cause: options?.cause,
        });
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
    /** @override @readonly */
    _tag = "UnsupportedKdfError";
    /** @type {unknown} */
    kdf;
    /**
     * @param {unknown} kdf
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(kdf, options) {
        super(`Unsupported KDF: ${kdf}. Only 'scrypt' and 'pbkdf2' are supported.`, {
            code: options?.code ?? -32602,
            context: { kdf, ...options?.context },
            docsPath: options?.docsPath || "/crypto/keystore/decrypt#error-handling",
            cause: options?.cause,
        });
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
    /** @override @readonly */
    _tag = "DecryptionError";
    /**
     * @param {string} [message]
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message = "Decryption failed", options) {
        super(message, {
            code: options?.code ?? -32000,
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
    /** @override @readonly */
    _tag = "EncryptionError";
    /**
     * @param {string} [message]
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message = "Encryption failed", options) {
        super(message, {
            code: options?.code ?? -32000,
            context: options?.context,
            docsPath: options?.docsPath || "/crypto/keystore/encrypt#error-handling",
            cause: options?.cause,
        });
        this.name = "EncryptionError";
    }
}
/**
 * Error thrown when scrypt N parameter is not a power of 2
 *
 * Scrypt requires N to be a power of 2 for correct operation.
 *
 * @see https://voltaire.tevm.sh/crypto/keystore
 * @since 0.1.42
 */
export class InvalidScryptNError extends KeystoreError {
    /** @override @readonly */
    _tag = "InvalidScryptNError";
    /** @type {number} */
    n;
    /**
     * @param {number} n
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(n, options) {
        super(`Invalid scrypt N parameter: ${n}. N must be a power of 2 (e.g., 1024, 2048, 4096, 16384, 262144).`, {
            code: options?.code ?? -32602,
            context: { n, ...options?.context },
            docsPath: options?.docsPath || "/crypto/keystore#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidScryptNError";
        this.n = n;
    }
}
/**
 * Error thrown when PBKDF2 iteration count is invalid
 *
 * PBKDF2 iteration count must be a positive integer. For security,
 * a minimum of 1000 iterations is recommended.
 *
 * @see https://voltaire.tevm.sh/crypto/keystore
 * @since 0.1.42
 */
export class InvalidPbkdf2IterationsError extends KeystoreError {
    /** @override @readonly */
    _tag = "InvalidPbkdf2IterationsError";
    /** @type {number} */
    iterations;
    /**
     * @param {number} iterations
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(iterations, options) {
        super(`Invalid PBKDF2 iteration count: ${iterations}. Iterations must be a positive integer (minimum 1).`, {
            code: options?.code ?? -32602,
            context: { iterations, ...options?.context },
            docsPath: options?.docsPath || "/crypto/keystore#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidPbkdf2IterationsError";
        this.iterations = iterations;
    }
}
