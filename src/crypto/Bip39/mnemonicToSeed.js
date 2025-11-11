import { mnemonicToSeed as _mnemonicToSeed } from "@scure/bip39";
import { assertValidMnemonic } from "./assertValidMnemonic.js";
import { Bip39Error } from "./errors.js";

/**
 * Convert mnemonic to seed (async)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedMnemonic.js').Mnemonic} mnemonic - BIP-39 mnemonic phrase
 * @param {string} [passphrase=""] - Optional passphrase for additional security
 * @returns {Promise<import('./BrandedSeed.js').Seed>} 64-byte seed
 * @throws {InvalidMnemonicError} If mnemonic is invalid
 * @throws {Bip39Error} If seed derivation fails
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const seed = await Bip39.mnemonicToSeed(mnemonic, "my passphrase");
 * ```
 */
export async function mnemonicToSeed(mnemonic, passphrase = "") {
	assertValidMnemonic(mnemonic);

	try {
		return /** @type {import('./BrandedSeed.js').Seed} */ (
			await _mnemonicToSeed(mnemonic, passphrase)
		);
	} catch (error) {
		throw new Bip39Error(`Seed derivation failed: ${error}`);
	}
}
