/**
 * Convert RLP Data to human-readable JSON format
 *
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP Data
 * @returns {unknown} JSON-serializable representation
 *
 * @example
 * ```javascript
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
 * const json = Rlp.toJSON(data);
 * // => { type: 'bytes', value: [1, 2, 3] }
 * ```
 */
export function toJSON(data) {
	if (data.type === "bytes") {
		return {
			type: "bytes",
			value: Array.from(data.value),
		};
	}

	return {
		type: "list",
		value: data.value.map((item) => toJSON(item)),
	};
}
