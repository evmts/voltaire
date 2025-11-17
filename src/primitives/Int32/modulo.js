/**
 * Compute modulo of two Int32 values
 *
 * @param {import('./Int32Type.js').BrandedInt32} a - Dividend
 * @param {import('./Int32Type.js').BrandedInt32} b - Divisor
 * @returns {import('./Int32Type.js').BrandedInt32} Remainder
 * @throws {Error} If divisor is zero
 */
export function modulo(a, b) {
	if (b === 0) {
		throw new Error("Modulo by zero");
	}

	const result = a % b;

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
