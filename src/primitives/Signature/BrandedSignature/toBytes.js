/**
 * Convert Signature to raw bytes (without metadata)
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature to convert
 * @returns {Uint8Array} Raw signature bytes
 *
 * @example
 * ```typescript
 * const bytes = Signature.toBytes(sig);
 * // Returns r + s (64 bytes) for ECDSA or signature (64 bytes) for Ed25519
 * ```
 */
export function toBytes(signature) {
	// Return a copy without metadata
	return new Uint8Array(signature);
}
