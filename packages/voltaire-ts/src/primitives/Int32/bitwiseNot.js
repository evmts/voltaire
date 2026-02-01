/**
 * Bitwise NOT of Int32 value
 *
 * @param {import('./Int32Type.js').BrandedInt32} value - Value
 * @returns {import('./Int32Type.js').BrandedInt32} Result
 */
export function bitwiseNot(value) {
	const result = ~value;

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
