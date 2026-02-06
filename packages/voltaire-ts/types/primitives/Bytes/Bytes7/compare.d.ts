/**
 * Compare two Bytes7 values lexicographically (byte-by-byte from left to right).
 *
 * @param {import('./Bytes7Type.js').Bytes7Type} a - First Bytes7
 * @param {import('./Bytes7Type.js').Bytes7Type} b - Second Bytes7
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes7.compare(Bytes7.fromHex("0x00000000000001"), Bytes7.fromHex("0x00000000000002")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes7.compare);
 * ```
 */
export function compare(a: import("./Bytes7Type.js").Bytes7Type, b: import("./Bytes7Type.js").Bytes7Type): -1 | 0 | 1;
//# sourceMappingURL=compare.d.ts.map