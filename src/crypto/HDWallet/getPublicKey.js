/**
 * Get public key bytes from extended key.
 *
 * Returns compressed secp256k1 public key.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {Uint8Array | null} 33-byte compressed secp256k1 public key or null
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const pubKey = HDWallet.getPublicKey(key);
 * ```
 */
export function getPublicKey(key) {
	return key.publicKey;
}
