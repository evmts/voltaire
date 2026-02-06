import { UintDivisionByZeroError } from "./errors.js";
/**
 * Divide Uint256 value
 *
 * @param uint - Dividend
 * @param b - Divisor
 * @returns Quotient (uint / b), floor division
 * @throws {UintDivisionByZeroError} If divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(10n);
 * const quotient1 = Uint.dividedBy(a, b); // 10
 * const quotient2 = a.dividedBy(b); // 10
 * ```
 */
export function dividedBy(uint, b) {
    if (b === 0n) {
        throw new UintDivisionByZeroError("Division by zero", {
            dividend: uint,
        });
    }
    return (uint / b);
}
