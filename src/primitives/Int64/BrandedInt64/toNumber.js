/**
 * Convert Int64 to number
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Int64 value
 * @returns {number} Number value
 * @throws {Error} If value exceeds safe integer range
 */
export function toNumber(value) {
	if (value < -9007199254740991n || value > 9007199254740991n) {
		throw new Error(
			`Int64 value ${value} exceeds safe integer range for number`,
		);
	}

	return Number(value);
}
