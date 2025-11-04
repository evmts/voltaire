import { HDKey } from "@scure/bip32";
import { HDWalletError } from "./errors.js";

/**
 * Create HD key from extended public key (xpub)
 *
 * Note: Cannot derive hardened children from public keys
 *
 * @param {string} xpub - Base58-encoded extended public key
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Extended key (public only)
 * @throws {HDWalletError} If extended public key is invalid
 *
 * @example
 * ```typescript
 * const pubKey = HDWallet.fromPublicExtendedKey("xpub...");
 * ```
 */
export function fromPublicExtendedKey(xpub) {
	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			HDKey.fromExtendedKey(xpub)
		);
	} catch (error) {
		throw new HDWalletError(`Invalid extended public key: ${error}`);
	}
}
