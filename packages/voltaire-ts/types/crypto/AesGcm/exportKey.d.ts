/**
 * Export CryptoKey to raw bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {CryptoKey} key - CryptoKey to export
 * @returns {Promise<Uint8Array>} Raw key bytes
 * @throws {InvalidKeyError} If key export fails
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const key = await AesGcm.generateKey(256);
 * const keyBytes = await AesGcm.exportKey(key);
 * ```
 */
export function exportKey(key: CryptoKey): Promise<Uint8Array>;
//# sourceMappingURL=exportKey.d.ts.map