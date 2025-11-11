import { HDKey } from "@scure/bip32";
import { HDWalletError } from "./errors.js";

/**
 * Create HD key from extended private key string.
 *
 * Deserializes base58-encoded xprv key.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} xprv - Base58-encoded extended private key (xprv...)
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Extended key with private key material
 * @throws {HDWalletError} If extended key format is invalid or decoding fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const key = HDWallet.fromExtendedKey("xprv9s21ZrQH143K3...");
 * ```
 */
export function fromExtendedKey(xprv) {
	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			HDKey.fromExtendedKey(xprv)
		);
	} catch (error) {
		throw new HDWalletError(`Invalid extended key: ${error}`, {
			code: "INVALID_EXTENDED_KEY",
			context: { xprv },
			docsPath: "/crypto/hdwallet/from-extended-key#error-handling",
			cause: error instanceof Error ? error : undefined,
		});
	}
}
