import type { BrandedRlp } from "./BrandedRlp.js";

/**
 * Convert RLP Data to human-readable JSON format
 *
 * @param data - RLP Data
 * @returns JSON-serializable representation
 *
 * @example
 * ```typescript
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
 * const json = Rlp.toJSON(data);
 * // => { type: 'bytes', value: [1, 2, 3] }
 * ```
 */
export function toJSON(data: BrandedRlp): unknown {
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
