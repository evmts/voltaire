/**
 * Create Int32 from number
 *
 * @param {number} value - Number to convert
 * @returns {import('./BrandedInt32.js').BrandedInt32} Int32 value
 * @throws {Error} If value is out of range or NaN
 */
export function fromNumber(value) {
	if (Number.isNaN(value)) {
		throw new Error("Cannot create Int32 from NaN");
	}

	// Truncate to 32-bit signed integer
	const num = value | 0;

	if (num < -2147483648 || num > 2147483647) {
		throw new Error(
			`Int32 value out of range: ${num} (must be between -2147483648 and 2147483647)`,
		);
	}

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (num);
}
