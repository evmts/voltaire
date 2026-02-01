/**
 * Derive child key using BIP-32 derivation path.
 *
 * Supports hierarchical paths with hardened (') and normal derivation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./ExtendedKeyType.js').BrandedExtendedKey} key - Parent extended key
 * @param {string} path - BIP-32 derivation path (e.g., "m/44'/60'/0'/0/0")
 * @returns {import('./ExtendedKeyType.js').BrandedExtendedKey} Derived child extended key
 * @throws {InvalidPathError} If path format is invalid or derivation fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const root = HDWallet.fromSeed(seed);
 * const child = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
 * ```
 */
export function derivePath(key: import("./ExtendedKeyType.js").BrandedExtendedKey, path: string): import("./ExtendedKeyType.js").BrandedExtendedKey;
//# sourceMappingURL=derivePath.d.ts.map