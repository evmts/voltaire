import { UintDivisionByZeroError } from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

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
export function dividedBy(uint: Uint256Type, b: Uint256Type): Uint256Type {
	if ((b as bigint) === 0n) {
		throw new UintDivisionByZeroError("Division by zero", {
			dividend: uint as bigint,
		});
	}
	return ((uint as bigint) / (b as bigint)) as Uint256Type;
}
