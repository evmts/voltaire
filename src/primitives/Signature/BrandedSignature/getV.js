import { InvalidAlgorithmError } from "./errors.js";

/**
 * Get v (recovery ID) from secp256k1 signature
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature
 * @returns {number | undefined} Recovery ID (27 or 28) or undefined
 * @throws {InvalidAlgorithmError} If signature is not secp256k1
 *
 * @example
 * ```typescript
 * const v = Signature.getV(sig);
 * ```
 */
export function getV(signature) {
	if (signature.algorithm !== "secp256k1") {
		throw new InvalidAlgorithmError(
			`getV only supported for secp256k1 signatures, got ${signature.algorithm}`,
			{
				value: signature.algorithm,
				expected: "secp256k1",
				docsPath: "/primitives/signature/get-v#error-handling",
			},
		);
	}

	return signature.v;
}
