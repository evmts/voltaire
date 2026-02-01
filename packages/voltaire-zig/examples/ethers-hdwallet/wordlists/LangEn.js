// @ts-nocheck
/**
 * English wordlist adapter for ethers-compatible API
 *
 * Wraps @scure/bip39 wordlist in ethers Wordlist interface
 */

import { wordlist as scureWordlist } from "@scure/bip39/wordlists/english.js";

/**
 * @typedef {import('../EthersHDWalletTypes.js').Wordlist} Wordlist
 */

/**
 * English BIP-39 wordlist (ethers-compatible)
 * @implements {Wordlist}
 */
class LangEnWordlist {
	/** @type {string} */
	locale = "en";

	/** @type {string[]} */
	#words;

	/** @type {Map<string, number>} */
	#wordIndex;

	constructor() {
		this.#words = scureWordlist;
		this.#wordIndex = new Map();
		for (let i = 0; i < this.#words.length; i++) {
			this.#wordIndex.set(this.#words[i], i);
		}
	}

	/**
	 * Split mnemonic phrase into words
	 * @param {string} phrase - Mnemonic phrase
	 * @returns {string[]} Words
	 */
	split(phrase) {
		return phrase.toLowerCase().normalize("NFKD").trim().split(/\s+/);
	}

	/**
	 * Join words into mnemonic phrase
	 * @param {string[]} words - Words
	 * @returns {string} Mnemonic phrase
	 */
	join(words) {
		return words.join(" ");
	}

	/**
	 * Get word at index
	 * @param {number} index - Word index (0-2047)
	 * @returns {string} Word
	 */
	getWord(index) {
		if (index < 0 || index >= 2048) {
			throw new Error(`Invalid word index: ${index}`);
		}
		return this.#words[index];
	}

	/**
	 * Get index of word
	 * @param {string} word - Word
	 * @returns {number} Index (0-2047) or -1 if not found
	 */
	getWordIndex(word) {
		const normalized = word.toLowerCase().normalize("NFKD");
		return this.#wordIndex.get(normalized) ?? -1;
	}
}

// Singleton instance
let _instance = null;

/**
 * English language wordlist provider
 */
export const LangEn = {
	/**
	 * Get singleton wordlist instance
	 * @returns {LangEnWordlist}
	 */
	wordlist() {
		if (!_instance) {
			_instance = new LangEnWordlist();
		}
		return _instance;
	},
};

export default LangEn;
