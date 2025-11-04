import { recoverAddress } from "./recoverAddress.js";

/**
 * Verify typed data signature
 *
 * @param {import('./BrandedEIP712.js').Signature} signature - ECDSA signature
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data that was signed
 * @param {import('../../primitives/Address/index.js').BrandedAddress} address - Expected signer address
 * @returns {boolean} True if signature is valid
 *
 * @example
 * ```typescript
 * const valid = EIP712.verifyTypedData(signature, typedData, signerAddress);
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
