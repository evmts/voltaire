import { validateMnemonic as _validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Validate a BIP-39 mnemonic phrase
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedMnemonic.js').Mnemonic} mnemonic - Mnemonic phrase to validate
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
