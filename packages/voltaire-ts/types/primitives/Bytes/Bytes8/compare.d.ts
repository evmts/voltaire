/**
 * Compare two Bytes8 values lexicographically (byte-by-byte from left to right).
 *
 * @param {import('./Bytes8Type.js').Bytes8Type} a - First Bytes8
 * @param {import('./Bytes8Type.js').Bytes8Type} b - Second Bytes8
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes8.compare(Bytes8.fromHex("0x0000000000000001"), Bytes8.fromHex("0x0000000000000002")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes8.compare);
 * ```
 */
export function compare(a: import("./Bytes8Type.js").Bytes8Type, b: import("./Bytes8Type.js").Bytes8Type): -1 | 0 | 1;
//# sourceMappingURL=compare.d.ts.map