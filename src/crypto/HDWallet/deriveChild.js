import { HDWalletError } from "./errors.js";

/**
 * Derive child key by index
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Parent extended key
 * @param {number} index - Child index (use HARDENED_OFFSET for hardened derivation)
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Derived extended key
 * @throws {HDWalletError} If derivation fails
 *
 * @example
 * ```typescript
 * // Normal derivation
 * const child = HDWallet.deriveChild(key, 0);
 *
 * // Hardened derivation
 * const hardenedChild = HDWallet.deriveChild(key, HDWallet.HARDENED_OFFSET);
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
