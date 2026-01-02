import { InvalidRangeError } from "../errors/index.js";

/**
 * Compute modulo of two Int32 values
 *
 * @param {import('./Int32Type.js').BrandedInt32} a - Dividend
 * @param {import('./Int32Type.js').BrandedInt32} b - Divisor
 * @returns {import('./Int32Type.js').BrandedInt32} Remainder
 * @throws {InvalidRangeError} If divisor is zero
 */
export function modulo(a, b) {
	if (b === 0) {
		throw new InvalidRangeError("Modulo by zero", {
			value: b,
			expected: "non-zero divisor",
			docsPath: "/primitives/int32#modulo",
		});
	}

	const result = a % b;

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
