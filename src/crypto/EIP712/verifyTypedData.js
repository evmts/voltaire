import { recoverAddress } from "./recoverAddress.js";

/**
 * Verify EIP-712 typed data signature against expected signer address.
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedEIP712.js').Signature} signature - ECDSA signature to verify
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data that was signed
 * @param {import('../../primitives/Address/index.js').BrandedAddress} address - Expected signer address
 * @returns {boolean} True if signature is valid and matches the address, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const valid = EIP712.verifyTypedData(signature, typedData, signerAddress);
 * if (valid) console.log('Signature verified');
 * ```
 */
export function verifyTypedData(signature, typedData, address) {
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
}
