import { HDKey } from "@scure/bip32";
import { HDWalletError } from "./errors.js";

/**
 * Create HD key from extended public key string.
 *
 * Cannot derive hardened children from public-only keys.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} xpub - Base58-encoded extended public key (xpub...)
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Extended key with public key only (no private key)
 * @throws {HDWalletError} If extended public key format is invalid or decoding fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const pubKey = HDWallet.fromPublicExtendedKey("xpub661MyMwAqRbcF...");
 * // Can only derive normal (non-hardened) children
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
