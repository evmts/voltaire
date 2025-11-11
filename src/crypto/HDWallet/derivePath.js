import { InvalidPathError } from "./errors.js";

/**
 * Derive child key using BIP-32 derivation path.
 *
 * Supports hierarchical paths with hardened (') and normal derivation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Parent extended key
 * @param {string} path - BIP-32 derivation path (e.g., "m/44'/60'/0'/0/0")
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Derived child extended key
 * @throws {InvalidPathError} If path format is invalid or derivation fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const root = HDWallet.fromSeed(seed);
 * const child = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
 * ```
 */
export function derivePath(key, path) {
	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			key.derive(path)
		);
	} catch (error) {
		throw new InvalidPathError(`Invalid derivation path "${path}": ${error}`);
	}
}
