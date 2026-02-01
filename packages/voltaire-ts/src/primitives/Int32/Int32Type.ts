/**
 * BrandedInt32: Signed 32-bit integer type with two's complement representation
 * Range: -2147483648 to 2147483647 (-2^31 to 2^31-1)
 *
 * A branded primitive that wraps a JavaScript number with compile-time type safety.
 * Negative values are represented using two's complement encoding.
 * Uses JavaScript's native number type which safely handles 32-bit signed integers.
 *
 * @example
 * ```typescript
 * import * as Int32 from './primitives/Int32/index.js';
 *
 * const a = Int32.from(-42);
 * const b = Int32.from(10);
 * const sum = Int32.plus(a, b); // -32
 * ```
 */

declare const brand: unique symbol;

/**
 * A signed 32-bit integer branded type.
 * Internally a JavaScript number constrained to [-2147483648, 2147483647].
 */
export type BrandedInt32 = number & {
	readonly [brand]: "Int32";
};

export const INT32_MIN = -2147483648;
export const INT32_MAX = 2147483647;
