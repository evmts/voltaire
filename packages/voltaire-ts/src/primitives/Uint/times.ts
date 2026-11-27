import { MAX } from "./constants.js";
import { UintOverflowError } from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

/**
 * Multiply two Uint256 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * Use `timesWrapping` for wrapping mod 2^256 arithmetic.
 *
 * @param uint - First operand
 * @param b - Second operand
 * @returns Product (uint * b)
 * @throws {UintOverflowError} If the result exceeds 2^256 - 1
 *
 * @example
 * ```typescript
 * const a = Uint(10n);
 * const b = Uint(5n);
 * const product1 = Uint.times(a, b); // 50n
 * const product2 = a.times(b); // 50n
 * ```
 */
export function times(uint: Uint256Type, b: Uint256Type): Uint256Type {
	const product = (uint as bigint) * (b as bigint);
	if (product > MAX) {
		throw new UintOverflowError(
			`Uint256 overflow: ${uint} * ${b} exceeds maximum (2^256 - 1)`,
			{ value: product, context: { a: uint, b, operation: "multiplication" } },
		);
	}
	return product as Uint256Type;
}
