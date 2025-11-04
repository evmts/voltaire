import { HDKey } from "@scure/bip32";
import { HDWalletError } from "./errors.js";

/**
 * Create HD key from extended private key (xprv)
 *
 * @param {string} xprv - Base58-encoded extended private key
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Extended key
 * @throws {HDWalletError} If extended key is invalid
 *
 * @example
 * ```typescript
 * const key = HDWallet.fromExtendedKey("xprv...");
 * ```
 */
export function fromExtendedKey(xprv) {
	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			HDKey.fromExtendedKey(xprv)
		);
	} catch (error) {
		throw new HDWalletError(`Invalid extended key: ${error}`);
	}
}
