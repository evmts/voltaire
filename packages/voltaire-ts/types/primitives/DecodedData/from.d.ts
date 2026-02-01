/**
 * Create DecodedData from values and types
 *
 * @template T
 * @param {T} values - Decoded values
 * @param {readonly string[]} types - ABI types
 * @returns {import('./DecodedDataType.js').DecodedDataType<T>} DecodedData
 *
 * @example
 * ```typescript
 * const data = DecodedData.from(
 *   { amount: 100n, recipient: "0x..." },
 *   ["uint256", "address"]
 * );
 * ```
 */
export function from<T>(values: T, types: readonly string[]): import("./DecodedDataType.js").DecodedDataType<T>;
//# sourceMappingURL=from.d.ts.map