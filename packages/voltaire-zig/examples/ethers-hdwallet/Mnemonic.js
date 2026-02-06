// @ts-nocheck
/**
 * Ethers-compatible Mnemonic class using Voltaire primitives
 *
 * @example
 * ```javascript
 * import { Mnemonic } from './Mnemonic.js';
 *
 * // From phrase
 * const mnemonic = Mnemonic.fromPhrase("abandon abandon abandon ...");
 * const seed = mnemonic.computeSeed();
 *
 * // From entropy
 * const mnemonic2 = Mnemonic.fromEntropy(new Uint8Array(16));
 * console.log(mnemonic2.phrase);
 * ```
 */

import { Bip39 } from "@tevm/voltaire";
import { InvalidEntropyError, InvalidMnemonicError } from "./errors.js";
import { LangEn } from "./wordlists/LangEn.js";

/**
 * @typedef {import('./EthersHDWalletTypes.js').Wordlist} Wordlist
 * @typedef {import('./EthersHDWalletTypes.js').MnemonicLike} MnemonicLike
 */

const _guard = Symbol("mnemonic-guard");

/**
 * Ethers-compatible Mnemonic class
 * Wraps BIP-39 operations with ethers v6 API
 */
export class Mnemonic {
	/** @type {string} */
	#phrase;
	/** @type {string} */
	#password;
	/** @type {string} */
	#entropy;
	/** @type {Wordlist} */
	#wordlist;

	/**
	 * @param {symbol} guard - Private constructor guard
	 * @param {string} entropy - Hex entropy
	 * @param {string} phrase - Mnemonic phrase
	 * @param {string} password - Passphrase
	 * @param {Wordlist} wordlist - Wordlist
	 */
	constructor(guard, entropy, phrase, password, wordlist) {
		if (guard !== _guard) {
			throw new Error("Use Mnemonic.fromPhrase() or Mnemonic.fromEntropy()");
		}
		this.#entropy = entropy;
		this.#phrase = phrase;
		this.#password = password ?? "";
		this.#wordlist = wordlist ?? LangEn.wordlist();
	}

	/** @returns {string} */
	get phrase() {
		return this.#phrase;
	}

	/** @returns {string} */
	get password() {
		return this.#password;
	}

	/** @returns {string} */
	get entropy() {
		return this.#entropy;
	}

	/** @returns {Wordlist} */
	get wordlist() {
		return this.#wordlist;
	}

	/**
	 * Compute BIP-39 seed from mnemonic
	 * Uses PBKDF2 with 2048 iterations of SHA-512
	 *
	 * @returns {Uint8Array} 64-byte seed
	 */
	computeSeed() {
		return Bip39.mnemonicToSeedSync(this.#phrase, this.#password);
	}

	/**
	 * Create Mnemonic from phrase string
	 *
	 * @param {string} phrase - BIP-39 mnemonic phrase
	 * @param {string} [password=""] - Optional passphrase
	 * @param {Wordlist} [wordlist] - Wordlist (default: English)
	 * @returns {Mnemonic}
	 */
	static fromPhrase(phrase, password, wordlist) {
		const wl = wordlist ?? LangEn.wordlist();

		// Normalize whitespace before validation
		const normalizedInput = phrase
			.toLowerCase()
			.normalize("NFKD")
			.trim()
			.replace(/\s+/g, " ");

		// Validate normalized phrase
		if (!Bip39.validateMnemonic(normalizedInput)) {
			throw new InvalidMnemonicError("Invalid mnemonic phrase", {
				wordCount: normalizedInput.split(" ").length,
			});
		}

		// Convert to entropy then back to fully normalized phrase
		const entropy = Mnemonic.phraseToEntropy(normalizedInput, wl);
		const normalizedPhrase = Mnemonic.entropyToPhrase(entropy, wl);

		return new Mnemonic(_guard, entropy, normalizedPhrase, password ?? "", wl);
	}

	/**
	 * Create Mnemonic from entropy bytes
	 *
	 * @param {Uint8Array | string} _entropy - 16-32 bytes of entropy
	 * @param {string} [password=""] - Optional passphrase
	 * @param {Wordlist} [wordlist] - Wordlist (default: English)
	 * @returns {Mnemonic}
	 */
	static fromEntropy(_entropy, password, wordlist) {
		const wl = wordlist ?? LangEn.wordlist();

		let entropy;
		if (typeof _entropy === "string") {
			entropy = hexToBytes(_entropy);
		} else {
			entropy = _entropy;
		}

		if (
			entropy.length < 16 ||
			entropy.length > 32 ||
			entropy.length % 4 !== 0
		) {
			throw new InvalidEntropyError(
				"Entropy must be 16, 20, 24, 28, or 32 bytes",
				{
					length: entropy.length,
				},
			);
		}

		const phrase = Bip39.entropyToMnemonic(entropy);
		const hexEntropy = bytesToHex(entropy);

		return new Mnemonic(_guard, hexEntropy, phrase, password ?? "", wl);
	}

	/**
	 * Convert entropy to mnemonic phrase
	 *
	 * @param {Uint8Array | string} _entropy - Entropy bytes or hex
	 * @param {Wordlist} [_wordlist] - Wordlist (default: English)
	 * @returns {string} Mnemonic phrase
	 */
	static entropyToPhrase(_entropy, _wordlist) {
		let entropy;
		if (typeof _entropy === "string") {
			entropy = hexToBytes(_entropy);
		} else {
			entropy = _entropy;
		}
		return Bip39.entropyToMnemonic(entropy);
	}

	/**
	 * Convert mnemonic phrase to entropy hex
	 *
	 * @param {string} phrase - Mnemonic phrase
	 * @param {Wordlist} [_wordlist] - Wordlist (default: English)
	 * @returns {string} Hex entropy (0x-prefixed)
	 */
	static phraseToEntropy(phrase, _wordlist) {
		// Validate first
		if (!Bip39.validateMnemonic(phrase)) {
			throw new InvalidMnemonicError("Invalid mnemonic phrase");
		}

		// Convert phrase to entropy using BIP-39 algorithm
		const words = phrase.trim().split(/\s+/);
		const wordlist = _wordlist ?? LangEn.wordlist();

		// Each word encodes 11 bits
		const bitLength = words.length * 11;
		const checksumBits = words.length / 3;
		const entropyBits = bitLength - checksumBits;
		const entropyBytes = entropyBits / 8;

		// Decode words to bits
		let bits = "";
		for (const word of words) {
			const index = wordlist.getWordIndex(word.normalize("NFKD"));
			if (index < 0) {
				throw new InvalidMnemonicError(`Unknown word: ${word}`);
			}
			bits += index.toString(2).padStart(11, "0");
		}

		// Extract entropy (without checksum)
		const entropyBitString = bits.slice(0, entropyBits);
		const entropy = new Uint8Array(entropyBytes);
		for (let i = 0; i < entropyBytes; i++) {
			entropy[i] = Number.parseInt(
				entropyBitString.slice(i * 8, (i + 1) * 8),
				2,
			);
		}

		return bytesToHex(entropy);
	}

	/**
	 * Check if phrase is valid BIP-39 mnemonic
	 *
	 * @param {string} phrase - Phrase to validate
	 * @param {Wordlist} [_wordlist] - Wordlist (default: English)
	 * @returns {boolean}
	 */
	static isValidMnemonic(phrase, _wordlist) {
		try {
			// Normalize whitespace before validation
			const normalized = phrase
				.toLowerCase()
				.normalize("NFKD")
				.trim()
				.replace(/\s+/g, " ");
			return Bip39.validateMnemonic(normalized);
		} catch {
			return false;
		}
	}
}

/**
 * Convert hex string to bytes
 * @param {string} hex - Hex string (with or without 0x)
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
	const h = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(h.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(h.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * Convert bytes to hex string
 * @param {Uint8Array} bytes - Bytes
 * @returns {string} 0x-prefixed hex
 */
function bytesToHex(bytes) {
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

export default Mnemonic;
