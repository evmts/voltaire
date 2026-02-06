/**
 * Create GasRefund from number, bigint, or string
 *
 * @param {number | bigint | string} value - Gas refund value
 * @returns {import('./GasRefundType.js').GasRefundType} Branded gas refund
 * @throws {InvalidFormatError} If value is negative
 *
 * @example
 * ```typescript
 * const refund = GasRefund.from(15000n); // SSTORE clear refund
 * const noRefund = GasRefund.from(0n);
 * ```
 */
export function from(value: number | bigint | string): import("./GasRefundType.js").GasRefundType;
//# sourceMappingURL=from.d.ts.map