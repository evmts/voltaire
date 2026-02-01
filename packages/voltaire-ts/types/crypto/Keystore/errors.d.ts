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
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message: string, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "InvalidMacError";
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
    /**
     * @param {unknown} version
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(version: unknown, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "UnsupportedVersionError";
    /** @type {unknown} */
    version: unknown;
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
    /**
     * @param {unknown} kdf
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(kdf: unknown, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "UnsupportedKdfError";
    /** @type {unknown} */
    kdf: unknown;
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
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "DecryptionError";
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
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "EncryptionError";
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
    /**
     * @param {number} n
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(n: number, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "InvalidScryptNError";
    /** @type {number} */
    n: number;
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
    /**
     * @param {number} iterations
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(iterations: number, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "InvalidPbkdf2IterationsError";
    /** @type {number} */
    iterations: number;
}
import { CryptoError } from "../../primitives/errors/index.js";
//# sourceMappingURL=errors.d.ts.map