/**
 * Bitwise NOT of Int64 value
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Value
 * @returns {import('./BrandedInt64.js').BrandedInt64} Result
 */
export function bitwiseNot(value) {
	const result = ~value;

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (result);
}
