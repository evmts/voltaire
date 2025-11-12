import { COMPONENT_SIZE } from "./constants.js";
import { InvalidAlgorithmError } from "./errors.js";

/**
 * Get r component from ECDSA signature
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature
 * @returns {import('../../Hash/index.js').BrandedHash} r component (32 bytes, BrandedHash)
 * @throws {InvalidAlgorithmError} If signature is not ECDSA
 *
 * @example
 * ```typescript
 * const r = Signature.getR(sig);
 * ```
 */
export function getR(signature) {
	if (signature.algorithm !== "secp256k1" && signature.algorithm !== "p256") {
		throw new InvalidAlgorithmError(
			`getR only supported for ECDSA signatures, got ${signature.algorithm}`,
			{
				value: signature.algorithm,
				expected: "secp256k1 or p256",
				docsPath: "/primitives/signature/get-r#error-handling",
			},
		);
	}

	return /** @type {import('../../Hash/index.js').BrandedHash} */ (
		signature.slice(0, COMPONENT_SIZE)
	);
}
