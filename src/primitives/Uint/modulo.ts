import { UintDivisionByZeroError } from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

/**
 * Modulo operation
 *
 * @param uint - Dividend
 * @param b - Divisor
 * @returns Remainder (uint % b)
 * @throws {UintDivisionByZeroError} If divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(30n);
 * const remainder1 = Uint.modulo(a, b); // 10
 * const remainder2 = a.modulo(b); // 10
 * ```
 */
export function modulo(uint: Uint256Type, b: Uint256Type): Uint256Type {
	if ((b as bigint) === 0n) {
		throw new UintDivisionByZeroError("Modulo by zero", {
			dividend: uint as bigint,
		});
	}
	return ((uint as bigint) % (b as bigint)) as Uint256Type;
}
