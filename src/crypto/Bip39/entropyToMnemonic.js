import { entropyToMnemonic as _entropyToMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { Bip39Error, InvalidEntropyError } from "./errors.js";

/**
 * Generate mnemonic from custom entropy
 *
 * @param {import('./BrandedEntropy.js').Entropy} entropy - Entropy bytes (16, 20, 24, 28, or 32 bytes)
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @returns {import('./BrandedMnemonic.js').Mnemonic} Mnemonic phrase
 *
 * @example
 * ```typescript
 * const entropy = crypto.getRandomValues(new Uint8Array(32));
 * const mnemonic = Bip39.entropyToMnemonic(entropy);
 * ```
 */
export function entropyToMnemonic(entropy, wl = wordlist) {
	const validLengths = [16, 20, 24, 28, 32];
	if (!validLengths.includes(entropy.length)) {
		throw new InvalidEntropyError(
			`Entropy must be 16, 20, 24, 28, or 32 bytes, got ${entropy.length}`,
		);
	}

	try {
		return /** @type {import('./BrandedMnemonic.js').Mnemonic} */ (_entropyToMnemonic(entropy, wl));
	} catch (error) {
		throw new Bip39Error(`Entropy to mnemonic conversion failed: ${error}`);
	}
}
