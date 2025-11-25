/**
 * Factory: Sign a message hash with private key
 * @param {Object} deps - Crypto dependencies
 * @param {(messageHash: import('../Hash/HashType.js').HashType, privateKey: import('./PrivateKeyType.js').PrivateKeyType) => import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType} deps.secp256k1Sign - Secp256k1 signing function
 * @returns {(privateKey: import('./PrivateKeyType.js').PrivateKeyType, hash: import('../Hash/HashType.js').HashType) => import('../Signature/SignatureType.js').SignatureType} Function that creates ECDSA signature
 */
export function Sign({ secp256k1Sign }) {
	/**
	 * Sign a message hash with private key
	 *
	 * @param {import('./PrivateKeyType.js').PrivateKeyType} privateKey - Private key (32 bytes)
	 * @param {import('../Hash/HashType.js').HashType} hash - Message hash to sign
	 * @returns {import('../Signature/SignatureType.js').SignatureType} ECDSA signature
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
		return /** @type {import('../Signature/SignatureType.js').SignatureType} */ (
			secp256k1Sign(hash, privateKey)
		);
	};
}
