/**
 * Create HD key from extended private key string.
 *
 * Deserializes base58-encoded xprv key.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} xprv - Base58-encoded extended private key (xprv...)
 * @returns {import('./ExtendedKeyType.js').BrandedExtendedKey} Extended key with private key material
 * @throws {HDWalletError} If extended key format is invalid or decoding fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const key = HDWallet.fromExtendedKey("xprv9s21ZrQH143K3...");
 * ```
 */
export function fromExtendedKey(xprv: string): import("./ExtendedKeyType.js").BrandedExtendedKey;
//# sourceMappingURL=fromExtendedKey.d.ts.map