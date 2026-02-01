import { InvalidFormatError } from "../errors/ValidationError.js";
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
export function from(value) {
    const bigintValue = typeof value === "bigint" ? value : BigInt(value);
    if (bigintValue < 0n) {
        throw new InvalidFormatError(`Gas refund must be non-negative, got ${value}`, {
            value,
            expected: "Non-negative bigint",
            code: -32602,
            docsPath: "/primitives/gas-refund/from#error-handling",
        });
    }
    return /** @type {import('./GasRefundType.js').GasRefundType} */ (bigintValue);
}
