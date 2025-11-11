import { wordlist } from "@scure/bip39/wordlists/english.js";
import { InvalidMnemonicError } from "./errors.js";
import { validateMnemonic } from "./validateMnemonic.js";

/**
 * Validate mnemonic or throw error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedMnemonic.js').Mnemonic} mnemonic - Mnemonic phrase to validate
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @returns {void}
 * @throws {InvalidMnemonicError} If mnemonic is invalid
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * try {
 *   Bip39.assertValidMnemonic(mnemonic);
 * } catch (e) {
 *   console.error("Invalid mnemonic:", e.message);
 * }
 * ```
 */
export function assertValidMnemonic(mnemonic, wl = wordlist) {
	if (!validateMnemonic(mnemonic, wl)) {
		throw new InvalidMnemonicError("Invalid BIP-39 mnemonic phrase");
	}
}
