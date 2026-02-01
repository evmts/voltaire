/**
 * Check if two GasRefund values are equal
 *
 * @this {import('./GasRefundType.js').GasRefundType}
 * @param {import('./GasRefundType.js').GasRefundType} other - Other gas refund value
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const a = GasRefund.from(15000n);
 * const b = GasRefund.from(15000n);
 * GasRefund._equals.call(a, b); // true
 * ```
 */
export function equals(other) {
    return this === other;
}
