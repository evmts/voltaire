/**
 * Converts RLP Data structure to raw JavaScript values (Uint8Array or nested arrays)
 *
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP Data to convert
 * @returns {Uint8Array | any[]} Raw value (Uint8Array for bytes, array for list)
 *
 * @example
 * ```javascript
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
 * const raw = toRaw(data);
 * // => Uint8Array([1, 2, 3])
 *
 * const listData = {
 *   type: 'list',
 *   value: [
 *     { type: 'bytes', value: new Uint8Array([1]) },
 *     { type: 'bytes', value: new Uint8Array([2]) }
 *   ]
 * };
 * const rawList = toRaw(listData);
 * // => [Uint8Array([1]), Uint8Array([2])]
 * ```
 */
export function toRaw(data) {
	if (data.type === "bytes") {
		return data.value;
	}

	// type === 'list'
	return data.value.map((item) => toRaw(item));
}
