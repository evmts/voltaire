/**
 * Bitwise NOT of Int32 value
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} value - Value
 * @returns {import('./BrandedInt32.js').BrandedInt32} Result
 */
export function bitwiseNot(value) {
	const result = ~value;

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (result);
}
