/**
 * Get private key bytes from extended key.
 *
 * Returns null for public-only keys.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {Uint8Array | null} 32-byte secp256k1 private key or null if public-only key
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const privKey = HDWallet.getPrivateKey(key);
 * if (privKey) console.log('Has private key');
 * ```
 */
export function getPrivateKey(key) {
	return key.privateKey;
}
