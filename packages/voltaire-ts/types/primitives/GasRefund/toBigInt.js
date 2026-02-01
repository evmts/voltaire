/**
 * Convert GasRefund to bigint (identity, for compatibility)
 *
 * @this {import('./GasRefundType.js').GasRefundType}
 * @returns {bigint} Gas refund as bigint
 *
 * @example
 * ```typescript
 * const refund = GasRefund.from(15000n);
 * GasRefund.toBigInt(refund); // 15000n
 * ```
 */
export function toBigInt() {
    return this;
}
