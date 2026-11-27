import { MAX } from "./constants.js";
import { UintOverflowError } from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

/**
 * Add two Uint256 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * Use `plusWrapping` for wrapping mod 2^256 arithmetic.
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Sum (uint + b)
 * @throws {UintOverflowError} If the result exceeds 2^256 - 1
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(50n);
 * const sum1 = Uint.plus(a, b); // 150n
 * const sum2 = a.plus(b); // 150n
 * ```
 */
export function plus(uint: Uint256Type, b: Uint256Type): Uint256Type {
	const sum = (uint as bigint) + (b as bigint);
	if (sum > MAX) {
		throw new UintOverflowError(
			`Uint256 overflow: ${uint} + ${b} exceeds maximum (2^256 - 1)`,
			{ value: sum, context: { a: uint, b, operation: "addition" } },
		);
	}
	return sum as Uint256Type;
}
