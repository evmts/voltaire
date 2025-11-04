import { HDKey } from "@scure/bip32";
import { InvalidSeedError, HDWalletError } from "./errors.js";

/**
 * Create root HD key from seed
 *
 * @param {Uint8Array} seed - BIP-39 seed (typically 64 bytes, must be 16-64 bytes)
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Root extended key
 * @throws {InvalidSeedError} If seed length is invalid
 * @throws {HDWalletError} If key derivation fails
 *
 * @example
 * ```typescript
 * const seed = await Bip39.mnemonicToSeed(mnemonic);
 * const root = HDWallet.fromSeed(seed);
 * ```
 */
export function fromSeed(seed) {
	if (seed.length < 16 || seed.length > 64) {
		throw new InvalidSeedError("Seed must be between 16 and 64 bytes");
	}

	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			HDKey.fromMasterSeed(seed)
		);
	} catch (error) {
		throw new HDWalletError(`Failed to create HD key from seed: ${error}`);
	}
}
