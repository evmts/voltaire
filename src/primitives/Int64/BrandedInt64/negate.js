/**
 * Negate Int64 value
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Value
 * @returns {import('./BrandedInt64.js').BrandedInt64} Negated value
 * @throws {Error} If value is MIN (negation would overflow)
 */
export function negate(value) {
	if (value === -9223372036854775808n) {
		throw new Error("Cannot negate Int64.MIN");
	}

	const result = -value;

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (result);
}
