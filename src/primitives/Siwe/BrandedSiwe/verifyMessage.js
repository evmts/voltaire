import { validate } from "./validate.js";
import { Verify } from "./verify.js";

/**
 * Factory: Verify both message validity and signature
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, hash: Uint8Array) => Uint8Array} deps.secp256k1RecoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => Uint8Array} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(message: import('./BrandedMessage.js').BrandedMessage, signature: import('./BrandedMessage.js').Signature, options?: {now?: Date}) => import('./BrandedMessage.js').ValidationResult} Function that verifies message and signature
 */
export function VerifyMessage({
	keccak256,
	secp256k1RecoverPublicKey,
	addressFromPublicKey,
}) {
	const verify = Verify({
		keccak256,
		secp256k1RecoverPublicKey,
		addressFromPublicKey,
	});

	/**
	 * Verify both message validity and signature
	 *
	 * Convenience method that combines validation and signature verification.
	 *
	 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
	 * @since 0.0.0
	 * @param {import('./BrandedMessage.js').BrandedMessage} message - The SIWE message to verify
	 * @param {import('./BrandedMessage.js').Signature} signature - The signature to verify
	 * @param {Object} [options] - Validation options
	 * @param {Date} [options.now] - Current time for timestamp checks
	 * @returns {import('./BrandedMessage.js').ValidationResult} Validation result with signature verification
	 * @throws {never}
	 * @example
	 * ```javascript
	 * import * as Siwe from './primitives/Siwe/index.js';
	 * const result = Siwe.verifyMessage(message, signature);
	 * if (result.valid) {
	 *   // Message structure and signature are both valid
	 * } else {
	 *   console.error(result.error.message);
	 * }
	 * ```
	 */
	return function verifyMessage(message, signature, options) {
		// First validate message structure
		const validationResult = validate(message, options);
		if (!validationResult.valid) {
			return validationResult;
		}

		// Then verify signature
		try {
			const signatureValid = verify(message, signature);
			if (!signatureValid) {
				return {
					valid: false,
					error: {
						type: "signature_mismatch",
						message: "Signature does not match message address",
					},
				};
			}
		} catch (e) {
			return {
				valid: false,
				error: {
					type: "signature_mismatch",
					message: `Signature verification failed: ${e instanceof Error ? e.message : String(e)}`,
				},
			};
		}

		return { valid: true };
	};
}
