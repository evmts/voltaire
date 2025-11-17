/**
 * Compute modulo of two Int64 values
 *
 * @param {import('./Int64Type.js').BrandedInt64} a - Dividend
 * @param {import('./Int64Type.js').BrandedInt64} b - Divisor
 * @returns {import('./Int64Type.js').BrandedInt64} Remainder
 * @throws {Error} If divisor is zero
 */
export function modulo(a, b) {
	if (b === 0n) {
		throw new Error("Modulo by zero");
	}

	const result = a % b;

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
