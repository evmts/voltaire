/**
 * Compare two Bytes lexicographically (byte-by-byte from left to right).
 *
 * Comparison is performed byte-by-byte starting from index 0. If all compared
 * bytes are equal, the shorter array is considered "less than" the longer one.
 *
 * @param {import('./BytesType.js').BytesType} a - First Bytes
 * @param {import('./BytesType.js').BytesType} b - Second Bytes
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * // Basic comparison
 * Bytes.compare(Bytes.fromHex("0x01"), Bytes.fromHex("0x02")); // -1
 * Bytes.compare(Bytes.fromHex("0x02"), Bytes.fromHex("0x01")); // 1
 * Bytes.compare(Bytes.fromHex("0x01"), Bytes.fromHex("0x01")); // 0
 *
 * // Length matters when prefixes match
 * Bytes.compare(Bytes.fromHex("0x01"), Bytes.fromHex("0x0102")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [bytes3, bytes1, bytes2].sort(Bytes.compare);
 * ```
 */
export function compare(a: import("./BytesType.js").BytesType, b: import("./BytesType.js").BytesType): -1 | 0 | 1;
//# sourceMappingURL=compare.d.ts.map