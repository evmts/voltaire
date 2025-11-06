/**
 * Check if value is a BrandedSignature
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedSignature.js').BrandedSignature} True if value is a BrandedSignature
 *
 * @example
 * ```typescript
 * if (Signature.is(value)) {
 *   console.log(value.algorithm);
 * }
 * ```
 */
export function is(value) {
	return (
		value instanceof Uint8Array &&
		/** @type {any} */ (value).__tag === "Signature" &&
		"algorithm" in /** @type {any} */ (value)
	);
}
