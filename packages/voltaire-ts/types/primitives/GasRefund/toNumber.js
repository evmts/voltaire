/**
 * Convert GasRefund to number
 *
 * @this {import('./GasRefundType.js').GasRefundType}
 * @returns {number} Gas refund as number
 *
 * @example
 * ```typescript
 * const refund = GasRefund.from(15000n);
 * GasRefund.toNumber(refund); // 15000
 * ```
 */
export function toNumber() {
    return Number(this);
}
