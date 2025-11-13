/**
 * Factory: Sign a message hash with private key
 * @param {Object} deps - Crypto dependencies
 * @param {(hash: Uint8Array, privateKey: Uint8Array) => Uint8Array} deps.secp256k1Sign - Secp256k1 signing function
 * @returns {(privateKey: Uint8Array, hash: Uint8Array) => Uint8Array} Function that creates ECDSA signature
 */
export function Sign({ secp256k1Sign }) {
	/**
	 * Sign a message hash with private key
	 *
	 * @param {import('./BrandedPrivateKey.js').BrandedPrivateKey} privateKey - Private key (32 bytes)
	 * @param {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} hash - Message hash to sign
	 * @returns {import('../../Signature/BrandedSignature/BrandedSignature.js').BrandedSignature} ECDSA signature
	 *
	 * @example
	 * ```typescript
	 * import { Sign } from '@tevm/voltaire/PrivateKey'
	 * import { sign as secp256k1Sign } from '@tevm/voltaire/crypto/Secp256k1'
	 *
	 * const sign = Sign({ secp256k1Sign })
	 * const sig = sign(pk, hash)
	 * ```
	 */
	return function sign(privateKey, hash) {
		return /** @type {import('../../Signature/BrandedSignature/BrandedSignature.js').BrandedSignature} */ (
			secp256k1Sign(hash, privateKey)
		);
	};
}
