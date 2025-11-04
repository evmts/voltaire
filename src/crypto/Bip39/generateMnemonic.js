import { generateMnemonic as _generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { Bip39Error } from "./errors.js";

/**
 * Generate a BIP-39 mnemonic phrase
 *
 * @param {128 | 160 | 192 | 224 | 256} [strength=256] - Entropy strength in bits (128=12 words, 256=24 words)
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @returns {import('./BrandedMnemonic.js').Mnemonic} Mnemonic phrase
 *
 * @example
 * ```typescript
 * // Generate 12-word mnemonic (128 bits)
 * const mnemonic12 = Bip39.generateMnemonic(128);
 *
 * // Generate 24-word mnemonic (256 bits)
 * const mnemonic24 = Bip39.generateMnemonic(256);
 * ```
 */
export function generateMnemonic(strength = 256, wl = wordlist) {
	try {
		return /** @type {import('./BrandedMnemonic.js').Mnemonic} */ (_generateMnemonic(wl, strength));
	} catch (error) {
		throw new Bip39Error(`Mnemonic generation failed: ${error}`);
	}
}
