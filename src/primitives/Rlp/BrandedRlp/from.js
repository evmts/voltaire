import { isData } from "./isData.js";

/**
 * Create RLP data from various inputs
 *
 * @param {Uint8Array | import('./BrandedRlp.js').BrandedRlp | import('./BrandedRlp.js').BrandedRlp[]} value - Uint8Array (bytes), RlpData, or array (list)
 * @returns {import('./BrandedRlp.js').BrandedRlp} RLP data structure
 *
 * @example
 * ```javascript
 * const rlp = Rlp.from(new Uint8Array([1, 2, 3]));
 * const rlp2 = Rlp.from([new Uint8Array([1]), new Uint8Array([2])]);
 * ```
 */
export function from(value) {
	if (value instanceof Uint8Array) {
		return { type: "bytes", value };
	}
	if (isData(value)) {
		return value;
	}
	if (Array.isArray(value)) {
		return { type: "list", value };
	}
	throw new Error("Invalid input for Rlp.from");
}
