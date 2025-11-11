import { HDKey } from "@scure/bip32";
import { HDWalletError } from "./errors.js";

/**
 * Create public-only version of extended key (neutered key).
 *
 * Removes private key material, keeping only public key and chain code.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key with or without private key
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Public-only extended key (cannot derive hardened children)
 * @throws {HDWalletError} If key does not have public key
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const pubOnlyKey = HDWallet.toPublic(key);
 * // Can share publicly without exposing private key
 * ```
 */
export function toPublic(key) {
	if (!key.publicKey) {
		throw new HDWalletError("Key does not have a public key", {
			code: "MISSING_PUBLIC_KEY",
			docsPath: "/crypto/hdwallet/to-public#error-handling",
		});
	}
	const xpub = key.publicExtendedKey;
	return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
		HDKey.fromExtendedKey(xpub)
	);
}
