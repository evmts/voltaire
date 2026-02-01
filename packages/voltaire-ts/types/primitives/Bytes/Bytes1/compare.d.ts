/**
 * Compare two Bytes1 values.
 *
 * @param {import('./Bytes1Type.js').Bytes1Type} a - First Bytes1
 * @param {import('./Bytes1Type.js').Bytes1Type} b - Second Bytes1
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes1.compare(Bytes1.fromNumber(1), Bytes1.fromNumber(2)); // -1
 * Bytes1.compare(Bytes1.fromNumber(2), Bytes1.fromNumber(1)); // 1
 * Bytes1.compare(Bytes1.fromNumber(1), Bytes1.fromNumber(1)); // 0
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes1.compare);
 * ```
 */
export function compare(a: import("./Bytes1Type.js").Bytes1Type, b: import("./Bytes1Type.js").Bytes1Type): -1 | 0 | 1;
//# sourceMappingURL=compare.d.ts.map