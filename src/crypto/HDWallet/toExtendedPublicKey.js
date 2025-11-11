import { HDWalletError } from "./errors.js";

/**
 * Serialize extended key to base58-encoded xpub string.
 *
 * Produces public-only key that cannot derive hardened children.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {string} Base58-encoded extended public key (xpub...)
 * @throws {HDWalletError} If key does not have public key
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const xpub = HDWallet.toExtendedPublicKey(key);
 * console.log(xpub); // "xpub661MyMwAqRbcF..."
 * ```
 */
export function toExtendedPublicKey(key) {
	if (!key.publicKey) {
		throw new HDWalletError("Key does not have a public key", {
			code: "MISSING_PUBLIC_KEY",
			docsPath: "/crypto/hdwallet/to-extended-public-key#error-handling",
		});
	}
	return key.publicExtendedKey;
}
