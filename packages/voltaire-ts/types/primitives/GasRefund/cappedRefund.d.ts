/**
 * Apply EIP-3529 refund cap (gasUsed / 5)
 * Post-London hard fork limitation on gas refunds
 *
 * @this {import('./GasRefundType.js').GasRefundType}
 * @param {bigint} gasUsed - Gas used by transaction
 * @returns {import('./GasRefundType.js').GasRefundType} Capped refund
 *
 * @example
 * ```typescript
 * const refund = GasRefund.from(15000n);
 * const gasUsed = 50000n;
 * // Cap = 50000 / 5 = 10000
 * GasRefund._cappedRefund.call(refund, gasUsed); // 10000n (capped)
 *
 * const smallRefund = GasRefund.from(5000n);
 * GasRefund._cappedRefund.call(smallRefund, gasUsed); // 5000n (not capped)
 * ```
 */
export function cappedRefund(this: import("./GasRefundType.js").GasRefundType, gasUsed: bigint): import("./GasRefundType.js").GasRefundType;
//# sourceMappingURL=cappedRefund.d.ts.map