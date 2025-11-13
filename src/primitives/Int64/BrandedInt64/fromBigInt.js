/**
 * Create Int64 from bigint
 *
 * @param {bigint} value - BigInt to convert
 * @returns {import('./BrandedInt64.js').BrandedInt64} Int64 value
 * @throws {Error} If value is out of range
 */
export function fromBigInt(value) {
	if (value < -9223372036854775808n || value > 9223372036854775807n) {
		throw new Error(
			`Int64 value out of range: ${value} (must be between -9223372036854775808 and 9223372036854775807)`,
		);
	}

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (value);
}
