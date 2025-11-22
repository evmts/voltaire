/**
 * Factory: Verify signature against public key
 * @param {Object} deps - Crypto dependencies
 * @param {(signature: import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType, hash: Uint8Array, publicKey: Uint8Array) => boolean} deps.secp256k1Verify - Secp256k1 signature verification function (expects 64-byte public key)
 * @returns {(publicKey: Uint8Array, hash: Uint8Array, signature: import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType) => boolean} Function that verifies ECDSA signature
 */
export function Verify({ secp256k1Verify }) {
	/**
	 * Verify signature against public key
	 *
	 * @param {import('./PublicKeyType.js').PublicKeyType} publicKey - Public key (64 bytes, uncompressed x,y)
	 * @param {import('../Hash/BrandedHash.js').BrandedHash} hash - Message hash
	 * @param {import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature
	 * @returns {boolean} True if signature is valid
	 *
	 * @example
	 * ```typescript
	 * import { Verify } from '@tevm/voltaire/PublicKey'
	 * import { verify as secp256k1Verify } from '@tevm/voltaire/crypto/Secp256k1'
	 *
	 * const verify = Verify({ secp256k1Verify })
	 * const valid = verify(pk, hash, sig)
	 * ```
	 */
	return function verify(publicKey, hash, signature) {
		return secp256k1Verify(signature, hash, publicKey);
	};
}
