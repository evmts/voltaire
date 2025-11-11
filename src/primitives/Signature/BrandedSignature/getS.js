import { COMPONENT_SIZE } from "./constants.js";
import { InvalidAlgorithmError } from "./errors.js";

/**
 * Get s component from ECDSA signature
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature
 * @returns {Uint8Array} s component (32 bytes)
 * @throws {InvalidAlgorithmError} If signature is not ECDSA
 *
 * @example
 * ```typescript
 * const s = Signature.getS(sig);
 * ```
 */
export function getS(signature) {
	if (signature.algorithm !== "secp256k1" && signature.algorithm !== "p256") {
		throw new InvalidAlgorithmError(
			`getS only supported for ECDSA signatures, got ${signature.algorithm}`,
			{
				value: signature.algorithm,
				expected: "secp256k1 or p256",
				docsPath: "/primitives/signature/get-s#error-handling",
			},
		);
	}

	return signature.slice(COMPONENT_SIZE, COMPONENT_SIZE * 2);
}
