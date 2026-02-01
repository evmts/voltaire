import { CryptoError, InvalidPrivateKeyError, } from "../../primitives/errors/index.js";
/**
 * Base error for HD Wallet operations (BIP-32/39/44)
 *
 * @see https://voltaire.tevm.sh/crypto/hdwallet for HD Wallet documentation
 * @since 0.0.0
 */
export class HDWalletError extends CryptoError {
    /**
     * @override
     * @readonly
     * @type {string}
     */
    _tag = "HDWalletError";
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32000,
            context: options?.context,
            docsPath: options?.docsPath || "/crypto/hdwallet#error-handling",
            cause: options?.cause,
        });
        this.name = "HDWalletError";
    }
}
/**
 * Error for invalid BIP-32 derivation paths
 *
 * Thrown when path format is invalid, contains invalid indices, or has invalid hardened notation
 *
 * @see https://voltaire.tevm.sh/crypto/hdwallet/parse-path
 * @since 0.0.0
 */
export class InvalidPathError extends HDWalletError {
    /** @override @readonly */
    _tag = "InvalidPathError";
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32001,
            context: options?.context,
            docsPath: options?.docsPath || "/crypto/hdwallet/parse-path#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidPathError";
    }
}
/**
 * Error for invalid seed data
 *
 * Thrown when seed length is incorrect or seed derivation fails
 *
 * @see https://voltaire.tevm.sh/crypto/hdwallet/from-seed
 * @since 0.0.0
 */
export class InvalidSeedError extends HDWalletError {
    /** @override @readonly */
    _tag = "InvalidSeedError";
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32002,
            context: options?.context,
            docsPath: options?.docsPath || "/crypto/hdwallet/from-seed#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidSeedError";
    }
}
/**
 * Error for invalid mnemonic phrases (BIP-39)
 *
 * Thrown when mnemonic has wrong word count, invalid words, or checksum failure
 *
 * @see https://voltaire.tevm.sh/crypto/hdwallet/validate-mnemonic
 * @since 0.0.0
 */
export class InvalidMnemonicError extends HDWalletError {
    /** @override @readonly */
    _tag = "InvalidMnemonicError";
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32003,
            context: options?.context,
            docsPath: options?.docsPath ||
                "/crypto/hdwallet/validate-mnemonic#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidMnemonicError";
    }
}
/**
 * Error for key derivation failures
 *
 * Thrown when child key derivation fails or produces invalid keys
 *
 * @see https://voltaire.tevm.sh/crypto/hdwallet/derive
 * @since 0.0.0
 */
export class DerivationError extends HDWalletError {
    /** @override @readonly */
    _tag = "DerivationError";
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {number} [options.code]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32004,
            context: options?.context,
            docsPath: options?.docsPath || "/crypto/hdwallet/derive#error-handling",
            cause: options?.cause,
        });
        this.name = "DerivationError";
    }
}
// Re-export for convenience
export { InvalidPrivateKeyError };
