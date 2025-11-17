/**
 * Get absolute value of Int64
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value
 * @returns {import('./Int64Type.js').BrandedInt64} Absolute value
 * @throws {Error} If value is MIN (abs would overflow)
 */
export function abs(value) {
	if (value === -9223372036854775808n) {
		throw new Error("Cannot get absolute value of Int64.MIN");
	}

	const result = value < 0n ? -value : value;

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
