/**
 * Get the algorithm of a signature
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature to check
 * @returns {import('./BrandedSignature.js').SignatureAlgorithm} Signature algorithm
 *
 * @example
 * ```typescript
 * const algorithm = Signature.getAlgorithm(sig);
 * // "secp256k1" | "p256" | "ed25519"
 * ```
 */
export function getAlgorithm(signature) {
	return signature.algorithm;
}
