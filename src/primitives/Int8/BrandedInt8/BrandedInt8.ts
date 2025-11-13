/**
 * BrandedInt8: Signed 8-bit integer type with two's complement representation
 * Range: -128 to 127
 *
 * A branded primitive that wraps a JavaScript number with compile-time type safety.
 * Negative values are represented using two's complement encoding.
 *
 * @example
 * ```typescript
 * import * as Int8 from './primitives/Int8/index.js';
 *
 * const a = Int8.from(-42);
 * const b = Int8.from(10);
 * const sum = Int8.plus(a, b); // -32
 * ```
 */

declare const brand: unique symbol;

/**
 * A signed 8-bit integer branded type.
 * Internally a JavaScript number constrained to [-128, 127].
 */
export type BrandedInt8 = number & {
	readonly [brand]: "Int8";
};

export const INT8_MIN = -128;
export const INT8_MAX = 127;
