import type { BrandedRlp } from "./BrandedRlp.js";

/**
 * Flatten nested list Data into array of bytes Data (depth-first)
 *
 * @param data - RLP Data to flatten
 * @returns Array of bytes Data
 *
 * @example
 * ```typescript
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
export function flatten(data: BrandedRlp): Array<BrandedRlp & { type: "bytes" }> {
	const result: Array<BrandedRlp & { type: "bytes" }> = [];

	function visit(d: BrandedRlp) {
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
