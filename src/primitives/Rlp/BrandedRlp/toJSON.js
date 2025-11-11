/**
 * Convert RLP Data to human-readable JSON format
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {import('./BrandedRlp.js').BrandedRlp} data - RLP data structure
 * @returns {unknown} JSON-serializable representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
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
