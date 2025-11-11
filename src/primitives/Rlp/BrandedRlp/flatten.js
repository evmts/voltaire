/**
 * Flatten nested list Data into array of bytes Data (depth-first)
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP data structure to flatten
 * @returns {Array<import('./BrandedRlp.js').BrandedRlp & { type: "bytes" }>} Array of bytes data (all nested lists flattened)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
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
	/** @type {Array<import('./BrandedRlp.js').BrandedRlp & { type: "bytes" }>} */
	const result = [];

	/**
	 * @param {import('./BrandedRlp.js').BrandedRlp} d
	 */
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
