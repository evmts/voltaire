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
export function from(values, types) {
    return {
        values,
        types,
    };
}
