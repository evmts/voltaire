/**
 * Base error for HD Wallet operations (BIP-32/39/44)
 *
 * @see https://voltaire.tevm.sh/crypto/hdwallet for HD Wallet documentation
 * @since 0.0.0
 */
export class HDWalletError extends CryptoError {
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
 * Error for invalid BIP-32 derivation paths
 *
 * Thrown when path format is invalid, contains invalid indices, or has invalid hardened notation
 *
 * @see https://voltaire.tevm.sh/crypto/hdwallet/parse-path
 * @since 0.0.0
 */
export class InvalidPathError extends HDWalletError {
    /** @override @readonly */
    override readonly _tag: "InvalidPathError";
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
    override readonly _tag: "InvalidSeedError";
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
    override readonly _tag: "InvalidMnemonicError";
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
    override readonly _tag: "DerivationError";
}
export { InvalidPrivateKeyError };
import { CryptoError } from "../../primitives/errors/index.js";
import { InvalidPrivateKeyError } from "../../primitives/errors/index.js";
//# sourceMappingURL=errors.d.ts.map