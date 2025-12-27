/**
 * Convert Signature to hex string
 *
 * Formats:
 * - ECDSA without v: 128 hex chars (64 bytes: r + s)
 * - ECDSA with v: 130 hex chars (65 bytes: r + s + v)
 * - Ed25519: 128 hex chars (64 bytes)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @param {boolean} [includeV=true] - Include v byte for secp256k1 (if present)
 * @returns {string} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Signature.toHex(sig);
 * // Returns "0x..." (130 chars with v, 128 chars without)
 *
 * // Exclude v even if present
 * const hexNoV = Signature.toHex(sig, false);
 * // Returns "0x..." (128 chars)
 * ```
 */
export function toHex(signature, includeV = true) {
	let result = "0x";

	// Always include r + s (64 bytes)
	for (let i = 0; i < 64; i++) {
		const b = signature[i] ?? 0;
		result += b.toString(16).padStart(2, "0");
	}

	// Include v for secp256k1 if present and requested
	if (
		includeV &&
		signature.algorithm === "secp256k1" &&
		signature.v !== undefined
	) {
		const vHex = signature.v.toString(16);
		// Ensure even length (pad to next even number of chars)
		const paddedVHex = vHex.length % 2 === 0 ? vHex : `0${vHex}`;
		result += paddedVHex;
	}

	return result;
}
