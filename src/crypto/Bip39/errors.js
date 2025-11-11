/**
 * Base error for BIP-39 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { Bip39Error } from './crypto/Bip39/index.js';
 * throw new Bip39Error('BIP-39 operation failed');
 * ```
 */
export class Bip39Error extends Error {
	constructor(message = "BIP-39 error") {
		super(message);
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
 * throw new InvalidMnemonicError('Invalid BIP-39 mnemonic phrase');
 * ```
 */
export class InvalidMnemonicError extends Bip39Error {
	constructor(message = "Invalid BIP-39 mnemonic phrase") {
		super(message);
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
 * throw new InvalidEntropyError('Invalid entropy size');
 * ```
 */
export class InvalidEntropyError extends Bip39Error {
	constructor(message = "Invalid entropy") {
		super(message);
		this.name = "InvalidEntropyError";
	}
}
