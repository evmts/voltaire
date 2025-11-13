/**
 * Factory: Verify signature against public key
 * @param {Object} deps - Crypto dependencies
 * @param {(signature: Uint8Array, hash: Uint8Array, publicKey: Uint8Array) => boolean} deps.secp256k1Verify - Secp256k1 signature verification function
 * @returns {(publicKey: Uint8Array, hash: Uint8Array, signature: Uint8Array) => boolean} Function that verifies ECDSA signature
 */
export function Verify({ secp256k1Verify }) {
	/**
	 * Verify signature against public key
	 *
	 * @param {import('./BrandedPublicKey.js').BrandedPublicKey} publicKey - Public key (64 bytes, uncompressed x,y)
	 * @param {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} hash - Message hash
	 * @param {import('../../Signature/BrandedSignature/BrandedSignature.js').BrandedSignature} signature - ECDSA signature
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
		// Add 0x04 prefix for uncompressed key
		const fullKey = new Uint8Array(65);
		fullKey[0] = 0x04;
		fullKey.set(publicKey, 1);

		return secp256k1Verify(signature, hash, fullKey);
	};
}
