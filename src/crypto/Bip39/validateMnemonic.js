import { validateMnemonic as _validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Validate a BIP-39 mnemonic phrase
 *
 * @param {import('./BrandedMnemonic.js').Mnemonic} mnemonic - Mnemonic phrase to validate
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @returns {boolean} True if valid, false otherwise
 *
 * @example
 * ```typescript
 * const mnemonic = "abandon abandon abandon...";
 * if (Bip39.validateMnemonic(mnemonic)) {
 *   console.log("Valid mnemonic");
 * }
 * ```
 */
export function validateMnemonic(mnemonic, wl = wordlist) {
	try {
		return _validateMnemonic(mnemonic, wl);
	} catch {
		return false;
	}
}
