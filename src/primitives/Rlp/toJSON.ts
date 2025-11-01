import type { Data } from "./Rlp.js";

/**
 * Convert RLP Data to human-readable JSON format (this: pattern)
 *
 * @param this - RLP Data
 * @returns JSON-serializable representation
 *
 * @example
 * ```typescript
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
 * const json = Rlp.toJSON.call(data);
 * // => { type: 'bytes', value: [1, 2, 3] }
 * ```
 */
export function toJSON(this: Data): unknown {
	if (this.type === "bytes") {
		return {
			type: "bytes",
			value: Array.from(this.value),
		};
	}

	return {
		type: "list",
		value: this.value.map((item) => toJSON.call(item)),
	};
}
