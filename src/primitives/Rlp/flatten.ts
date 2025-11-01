import type { Data } from "./Rlp.js";

/**
 * Flatten nested list Data into array of bytes Data (depth-first) (this: pattern)
 *
 * @param this - RLP Data to flatten
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
 * const flat = Rlp.flatten.call(nested);
 * // => [
 * //   { type: 'bytes', value: Uint8Array([1]) },
 * //   { type: 'bytes', value: Uint8Array([2]) }
 * // ]
 * ```
 */
export function flatten(this: Data): Array<Data & { type: "bytes" }> {
	const result: Array<Data & { type: "bytes" }> = [];

	function visit(d: Data) {
		if (d.type === "bytes") {
			result.push(d);
		} else {
			for (const item of d.value) {
				visit(item);
			}
		}
	}

	visit(this);
	return result;
}
