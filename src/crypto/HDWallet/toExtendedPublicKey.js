import { HDWalletError } from "./errors.js";

/**
 * Serialize extended public key to base58 (xpub)
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {string} Base58-encoded extended public key
 * @throws {HDWalletError} If key does not have a public key
 *
 * @example
 * ```typescript
 * const xpub = HDWallet.toExtendedPublicKey(key);
 * ```
 */
export function toExtendedPublicKey(key) {
	if (!key.publicKey) {
		throw new HDWalletError("Key does not have a public key");
	}
	return key.publicExtendedKey;
}
