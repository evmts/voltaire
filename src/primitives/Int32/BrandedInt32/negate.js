/**
 * Negate Int32 value
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} value - Value
 * @returns {import('./BrandedInt32.js').BrandedInt32} Negated value
 * @throws {Error} If value is MIN (negation would overflow)
 */
export function negate(value) {
	if (value === -2147483648) {
		throw new Error("Cannot negate Int32.MIN");
	}

	const result = -value;

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (result);
}
