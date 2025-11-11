import { HDWalletError } from "./errors.js";

/**
 * Derive child key by index using BIP-32.
 *
 * Supports both normal and hardened derivation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Parent extended key
 * @param {number} index - Child index (add HARDENED_OFFSET for hardened derivation)
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Derived child extended key
 * @throws {HDWalletError} If derivation fails or index is invalid
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * // Normal derivation
 * const child = HDWallet.deriveChild(key, 0);
 * // Hardened derivation
 * const hardened = HDWallet.deriveChild(key, HDWallet.HARDENED_OFFSET + 0);
 * ```
 */
export function deriveChild(key, index) {
	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			key.deriveChild(index)
		);
	} catch (error) {
		throw new HDWalletError(
			`Failed to derive child at index ${index}: ${error}`,
		);
	}
}
