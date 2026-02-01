/**
 * Import raw key material as CryptoKey
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} keyMaterial - 16-byte (128-bit) or 32-byte (256-bit) key
 * @returns {Promise<CryptoKey>} CryptoKey for use with WebCrypto API
 * @throws {InvalidKeyError} If key import fails or key size is invalid
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const keyBytes = crypto.getRandomValues(new Uint8Array(32));
 * const key = await AesGcm.importKey(keyBytes);
 * ```
 */
export function importKey(keyMaterial: Uint8Array): Promise<CryptoKey>;
//# sourceMappingURL=importKey.d.ts.map