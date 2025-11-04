/**
 * Base error for BIP-39 operations
 */
export class Bip39Error extends Error {
	constructor(message = "BIP-39 error") {
		super(message);
		this.name = "Bip39Error";
	}
}

/**
 * Error thrown when mnemonic is invalid
 */
export class InvalidMnemonicError extends Bip39Error {
	constructor(message = "Invalid BIP-39 mnemonic phrase") {
		super(message);
		this.name = "InvalidMnemonicError";
	}
}

/**
 * Error thrown when entropy is invalid
 */
export class InvalidEntropyError extends Bip39Error {
	constructor(message = "Invalid entropy") {
		super(message);
		this.name = "InvalidEntropyError";
	}
}
