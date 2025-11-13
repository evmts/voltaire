/**
 * Get absolute value of Int32
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} value - Value
 * @returns {import('./BrandedInt32.js').BrandedInt32} Absolute value
 * @throws {Error} If value is MIN (abs would overflow)
 */
export function abs(value) {
	if (value === -2147483648) {
		throw new Error("Cannot get absolute value of Int32.MIN");
	}

	const result = value < 0 ? -value : value;

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (result);
}
