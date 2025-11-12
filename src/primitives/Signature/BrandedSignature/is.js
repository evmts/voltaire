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
	const val = /** @type {any} */ (value);
	return (
		value instanceof Uint8Array &&
		"algorithm" in val &&
		(val.algorithm === "secp256k1" ||
			val.algorithm === "p256" ||
			val.algorithm === "ed25519")
	);
}
