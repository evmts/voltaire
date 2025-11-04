import { HDKey } from "@scure/bip32";
import { HDWalletError } from "./errors.js";

/**
 * Create public-only version of key (neutered key)
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Public-only extended key
 * @throws {HDWalletError} If key does not have a public key
 *
 * @example
 * ```typescript
 * const pubOnlyKey = HDWallet.toPublic(key);
 * ```
 */
export function toPublic(key) {
	if (!key.publicKey) {
		throw new HDWalletError("Key does not have a public key");
	}
	const xpub = key.publicExtendedKey;
	return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
		HDKey.fromExtendedKey(xpub)
	);
}
