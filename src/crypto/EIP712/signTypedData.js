import { Eip712Error } from "./errors.js";

/**
 * Factory: Sign EIP-712 typed data with ECDSA private key.
 *
 * Produces a signature that can be verified against the signer's address.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(typedData: import('./BrandedEIP712.js').TypedData) => import('../../primitives/Hash/index.js').BrandedHash} deps.hashTypedData - Hash typed data function
 * @param {(hash: Uint8Array, privateKey: Uint8Array) => import('./BrandedEIP712.js').Signature} deps.sign - Secp256k1 sign function
 * @returns {(typedData: import('./BrandedEIP712.js').TypedData, privateKey: Uint8Array) => import('./BrandedEIP712.js').Signature} Function that signs typed data
 * @throws {Eip712Error} If private key length is invalid or signing fails
 * @example
 * ```javascript
 * import { SignTypedData } from './crypto/EIP712/signTypedData.js';
 * import { HashTypedData } from './hashTypedData.js';
 * import { sign } from '../Secp256k1/sign.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * const hashTypedData = HashTypedData({ keccak256, hashDomain, hashStruct });
 * const signTypedData = SignTypedData({ hashTypedData, sign });
 * const privateKey = new Uint8Array(32);
 * const signature = signTypedData(typedData, privateKey);
 * ```
 */
export function SignTypedData({ hashTypedData, sign }) {
	return function signTypedData(typedData, privateKey) {
		const hash = hashTypedData(typedData);

		// Use Secp256k1.sign which handles recovery bit calculation
		return sign(hash, privateKey);
	};
}
