/**
 * Serialize extended key to base58-encoded xpub string.
 *
 * Produces public-only key that cannot derive hardened children.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./ExtendedKeyType.js').BrandedExtendedKey} key - Extended key
 * @returns {string} Base58-encoded extended public key (xpub...)
 * @throws {HDWalletError} If key does not have public key
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const xpub = HDWallet.toExtendedPublicKey(key);
 * console.log(xpub); // "xpub661MyMwAqRbcF..."
 * ```
 */
export function toExtendedPublicKey(key: import("./ExtendedKeyType.js").BrandedExtendedKey): string;
//# sourceMappingURL=toExtendedPublicKey.d.ts.map