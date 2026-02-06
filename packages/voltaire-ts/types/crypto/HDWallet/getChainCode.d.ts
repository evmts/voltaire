/**
 * Get chain code from extended key.
 *
 * Chain code is used in BIP-32 child key derivation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./ExtendedKeyType.js').BrandedExtendedKey} key - Extended key
 * @returns {Uint8Array | null} 32-byte chain code or null if not available
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const chainCode = HDWallet.getChainCode(key);
 * ```
 */
export function getChainCode(key: import("./ExtendedKeyType.js").BrandedExtendedKey): Uint8Array | null;
//# sourceMappingURL=getChainCode.d.ts.map