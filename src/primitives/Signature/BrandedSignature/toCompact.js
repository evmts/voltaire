import { ECDSA_WITH_V_SIZE } from "./constants.js";

/**
 * Convert Signature to compact format (with v if present)
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature to convert
 * @returns {Uint8Array} Compact signature (64 bytes or 65 bytes with v)
 *
 * @example
 * ```typescript
 * const compact = Signature.toCompact(sig);
 * // Returns r + s (64 bytes) or r + s + v (65 bytes) for secp256k1
 * ```
 */
export function toCompact(signature) {
	if (signature.v !== undefined && signature.algorithm === "secp256k1") {
		const result = new Uint8Array(ECDSA_WITH_V_SIZE);
		result.set(signature, 0);
		result[64] = signature.v;
		return result;
	}
	return new Uint8Array(signature);
}
