/**
 * BrandedInt64: Signed 64-bit integer type with two's complement representation
 * Range: -9223372036854775808n to 9223372036854775807n (-2^63 to 2^63-1)
 *
 * A branded primitive that wraps a JavaScript bigint with compile-time type safety.
 * Negative values are represented using two's complement encoding.
 * Uses JavaScript's bigint type for 64-bit signed integers.
 *
 * @example
 * ```typescript
 * import * as Int64 from './primitives/Int64/index.js';
 *
 * const a = Int64.from(-42n);
 * const b = Int64.from(10n);
 * const sum = Int64.plus(a, b); // -32n
 * ```
 */

declare const brand: unique symbol;

/**
 * A signed 64-bit integer branded type.
 * Internally a JavaScript bigint constrained to [-2^63, 2^63-1].
 */
export type BrandedInt64 = bigint & {
	readonly [brand]: "Int64";
};

export const INT64_MIN = -9223372036854775808n;
export const INT64_MAX = 9223372036854775807n;
