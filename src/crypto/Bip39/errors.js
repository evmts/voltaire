import { CryptoError } from "../../primitives/errors/CryptoError.js";
import { InvalidFormatError } from "../../primitives/errors/ValidationError.js";

/**
 * Base error for BIP-39 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { Bip39Error } from './crypto/Bip39/index.js';
 * throw new Bip39Error('BIP-39 operation failed', {
 *   code: 'BIP39_ERROR',
 *   context: { operation: 'generate' },
 *   docsPath: '/crypto/bip39#error-handling',
 *   cause: originalError
 * });
 * ```
 */
export class Bip39Error extends CryptoError {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "BIP39_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Bip39Error";
	}
}

/**
 * Error thrown when mnemonic is invalid
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidMnemonicError } from './crypto/Bip39/index.js';
 * throw new InvalidMnemonicError('Invalid BIP-39 mnemonic phrase', {
 *   code: 'BIP39_INVALID_MNEMONIC',
 *   context: { wordCount: 11 },
 *   docsPath: '/crypto/bip39/validate-mnemonic#error-handling'
 * });
 * ```
 */
export class InvalidMnemonicError extends InvalidFormatError {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "BIP39_INVALID_MNEMONIC",
			value: options?.context?.mnemonic || "",
			expected: "Valid BIP-39 mnemonic (12, 15, 18, 21, or 24 words)",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidMnemonicError";
	}
}

/**
 * Error thrown when entropy is invalid
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidEntropyError } from './crypto/Bip39/index.js';
 * throw new InvalidEntropyError('Invalid entropy size', {
 *   code: 'BIP39_INVALID_ENTROPY_SIZE',
 *   context: { size: 15, expected: '16, 20, 24, 28, or 32 bytes' },
 *   docsPath: '/crypto/bip39/entropy-to-mnemonic#error-handling'
 * });
 * ```
 */
export class InvalidEntropyError extends Bip39Error {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "BIP39_INVALID_ENTROPY",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidEntropyError";
	}
}
