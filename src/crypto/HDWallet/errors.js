import {
	CryptoError,
	InvalidPrivateKeyError,
} from "../../primitives/errors/index.js";

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
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "HD_WALLET_ERROR",
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
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "INVALID_PATH",
			context: options?.context,
			docsPath:
				options?.docsPath || "/crypto/hdwallet/parse-path#error-handling",
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
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "INVALID_SEED",
			context: options?.context,
			docsPath:
				options?.docsPath || "/crypto/hdwallet/from-seed#error-handling",
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
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "INVALID_MNEMONIC",
			context: options?.context,
			docsPath:
				options?.docsPath ||
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
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "DERIVATION_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/hdwallet/derive#error-handling",
			cause: options?.cause,
		});
		this.name = "DerivationError";
	}
}

// Re-export for convenience
export { InvalidPrivateKeyError };
