import { mnemonicToSeedSync as _mnemonicToSeedSync } from "@scure/bip39";
import { assertValidMnemonic } from "./assertValidMnemonic.js";
import { Bip39Error } from "./errors.js";

/**
 * Convert mnemonic to seed (sync)
 *
 * @param {import('./BrandedMnemonic.js').Mnemonic} mnemonic - BIP-39 mnemonic phrase
 * @param {string} [passphrase=""] - Optional passphrase for additional security
 * @returns {import('./BrandedSeed.js').Seed} 64-byte seed
 *
 * @example
 * ```typescript
 * const seed = Bip39.mnemonicToSeedSync(mnemonic);
 * ```
 */
export function mnemonicToSeedSync(mnemonic, passphrase = "") {
	assertValidMnemonic(mnemonic);

	try {
		return /** @type {import('./BrandedSeed.js').Seed} */ (
			_mnemonicToSeedSync(mnemonic, passphrase)
		);
	} catch (error) {
		throw new Bip39Error(`Seed derivation failed: ${error}`);
	}
}
