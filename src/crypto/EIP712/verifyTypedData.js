/**
 * Factory: Verify EIP-712 typed data signature against expected signer address.
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(signature: import('./BrandedEIP712.js').Signature, typedData: import('./BrandedEIP712.js').TypedData) => import('../../primitives/Address/index.js').BrandedAddress} deps.recoverAddress - Recover address function
 * @returns {(signature: import('./BrandedEIP712.js').Signature, typedData: import('./BrandedEIP712.js').TypedData, address: import('../../primitives/Address/index.js').BrandedAddress) => boolean} Function that verifies signature
 * @throws {never}
 * @example
 * ```javascript
 * import { VerifyTypedData } from './crypto/EIP712/verifyTypedData.js';
 * import { RecoverAddress } from './recoverAddress.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { recoverPublicKey } from '../Secp256k1/recoverPublicKey.js';
 * const recoverAddress = RecoverAddress({ keccak256, recoverPublicKey, hashTypedData });
 * const verifyTypedData = VerifyTypedData({ recoverAddress });
 * const valid = verifyTypedData(signature, typedData, signerAddress);
 * ```
 */
export function VerifyTypedData({ recoverAddress }) {
	return function verifyTypedData(signature, typedData, address) {
		try {
			const recoveredAddress = recoverAddress(signature, typedData);

			// Constant-time comparison
			if (recoveredAddress.length !== address.length) {
				return false;
			}
			let result = 0;
			for (let i = 0; i < recoveredAddress.length; i++) {
				result |= recoveredAddress[i] ^ address[i];
			}
			return result === 0;
		} catch {
			return false;
		}
	};
}
