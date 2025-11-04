import { HDWalletError } from "./errors.js";

/**
 * Serialize extended private key to base58 (xprv)
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {string} Base58-encoded extended private key
 * @throws {HDWalletError} If key does not have a private key
 *
 * @example
 * ```typescript
 * const xprv = HDWallet.toExtendedPrivateKey(key);
 * ```
 */
export function toExtendedPrivateKey(key) {
	if (!key.privateKey) {
		throw new HDWalletError("Key does not have a private key");
	}
	return key.privateExtendedKey;
}
