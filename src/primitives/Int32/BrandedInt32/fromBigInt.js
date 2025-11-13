/**
 * Create Int32 from bigint
 *
 * @param {bigint} value - BigInt to convert
 * @returns {import('./BrandedInt32.js').BrandedInt32} Int32 value
 * @throws {Error} If value is out of range
 */
export function fromBigInt(value) {
	if (value < -2147483648n || value > 2147483647n) {
		throw new Error(
			`Int32 value out of range: ${value} (must be between -2147483648 and 2147483647)`,
		);
	}

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (
		Number(value)
	);
}
