/**
 * Serialize extended key to base58-encoded xprv string.
 *
 * Requires key with private key material.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./ExtendedKeyType.js').BrandedExtendedKey} key - Extended key with private key
 * @returns {string} Base58-encoded extended private key (xprv...)
 * @throws {HDWalletError} If key does not have private key material
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const xprv = HDWallet.toExtendedPrivateKey(key);
 * console.log(xprv); // "xprv9s21ZrQH143K..."
 * ```
 */
export function toExtendedPrivateKey(key: import("./ExtendedKeyType.js").BrandedExtendedKey): string;
//# sourceMappingURL=toExtendedPrivateKey.d.ts.map