/**
 * Flatten nested list Data into array of bytes Data (depth-first)
 *
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP Data to flatten
 * @returns {Array<import('./BrandedRlp.js').BrandedRlp & { type: "bytes" }>} Array of bytes Data
 *
 * @example
 * ```javascript
 * const nested = {
 *   type: 'list',
 *   value: [
 *     { type: 'bytes', value: new Uint8Array([1]) },
 *     {
 *       type: 'list',
 *       value: [{ type: 'bytes', value: new Uint8Array([2]) }]
 *     }
 *   ]
 * };
 * const flat = Rlp.flatten(nested);
 * // => [
 * //   { type: 'bytes', value: Uint8Array([1]) },
 * //   { type: 'bytes', value: Uint8Array([2]) }
 * // ]
 * ```
 */
export function flatten(data) {
	const result = [];

	function visit(d) {
		if (d.type === "bytes") {
			result.push(d);
		} else {
			for (const item of d.value) {
				visit(item);
			}
		}
	}

	visit(data);
	return result;
}
