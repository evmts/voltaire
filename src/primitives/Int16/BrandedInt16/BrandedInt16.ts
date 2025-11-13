/**
 * BrandedInt16: Signed 16-bit integer type with two's complement representation
 * Range: -32768 to 32767
 *
 * A branded primitive that wraps a JavaScript number with compile-time type safety.
 * Negative values are represented using two's complement encoding.
 *
 * @example
 * ```typescript
 * import * as Int16 from './primitives/Int16/index.js';
 *
 * const a = Int16.from(-1000);
 * const b = Int16.from(500);
 * const sum = Int16.plus(a, b); // -500
 * ```
 */

declare const brand: unique symbol;

/**
 * A signed 16-bit integer branded type.
 * Internally a JavaScript number constrained to [-32768, 32767].
 */
export type BrandedInt16 = number & {
	readonly [brand]: "Int16";
};

export const INT16_MIN = -32768;
export const INT16_MAX = 32767;
