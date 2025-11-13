/**
 * Create Int64 from number
 *
 * @param {number} value - Number to convert
 * @returns {import('./BrandedInt64.js').BrandedInt64} Int64 value
 * @throws {Error} If value is out of range or NaN
 */
export function fromNumber(value) {
	if (Number.isNaN(value)) {
		throw new Error("Cannot create Int64 from NaN");
	}

	if (!Number.isFinite(value)) {
		throw new Error("Cannot create Int64 from Infinity");
	}

	const bigintVal = BigInt(Math.trunc(value));

	if (bigintVal < -9223372036854775808n || bigintVal > 9223372036854775807n) {
		throw new Error(
			`Int64 value out of range: ${bigintVal} (must be between -9223372036854775808 and 9223372036854775807)`,
		);
	}

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (bigintVal);
}
