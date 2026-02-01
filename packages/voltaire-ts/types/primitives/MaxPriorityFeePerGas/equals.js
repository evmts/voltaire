/**
 * Check if two MaxPriorityFeePerGas values are equal
 *
 * @this {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType}
 * @param {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} other - Value to compare
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const fee1 = MaxPriorityFeePerGas.from(2000000000n);
 * const fee2 = MaxPriorityFeePerGas.from(2000000000n);
 * MaxPriorityFeePerGas.equals(fee1, fee2); // true
 * ```
 */
export function equals(other) {
    return this === other;
}
