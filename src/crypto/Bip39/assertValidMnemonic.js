import { wordlist } from "@scure/bip39/wordlists/english.js";
import { InvalidMnemonicError } from "./errors.js";
import { validateMnemonic } from "./validateMnemonic.js";

/**
 * Validate mnemonic or throw error
 *
 * @param {import('./BrandedMnemonic.js').Mnemonic} mnemonic - Mnemonic phrase to validate
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @throws {InvalidMnemonicError} If mnemonic is invalid
 *
 * @example
 * ```typescript
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
