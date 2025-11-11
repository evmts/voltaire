import { COMPONENT_SIZE } from "./constants.js";
import { InvalidAlgorithmError } from "./errors.js";

/**
 * Get r component from ECDSA signature
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature
 * @returns {Uint8Array} r component (32 bytes)
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

	return signature.slice(0, COMPONENT_SIZE);
}
