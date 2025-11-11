import { validate } from "./validate.js";
import { verify } from "./verify.js";

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
export function verifyMessage(message, signature, options) {
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
}
