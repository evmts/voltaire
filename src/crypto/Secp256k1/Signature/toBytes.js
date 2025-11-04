// @ts-nocheck
/**
 * Convert signature to bytes with v appended (65 bytes: r || s || v)
 *
 * @param {import('../BrandedSignature.js').BrandedSignature} signature - ECDSA signature
 * @returns {Uint8Array} 65-byte signature
 *
 * @example
 * ```typescript
 * const bytes = Signature.toBytes(signature);
 * console.log(bytes.length); // 65
 * ```
 */
export function toBytes(signature) {
	const result = new Uint8Array(65);
	result.set(signature.r, 0);
	result.set(signature.s, 32);
	result[64] = signature.v;
	return result;
}
