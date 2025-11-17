/**
 * Int128 constants
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 */

/**
 * Minimum Int128 value: -2^127
 * @type {bigint}
 */
export const MIN = -(2n ** 127n);

/**
 * Maximum Int128 value: 2^127 - 1
 * @type {bigint}
 */
export const MAX = 2n ** 127n - 1n;

/**
 * Zero value
 * @type {bigint}
 */
export const ZERO = 0n;

/**
 * One value
 * @type {bigint}
 */
export const ONE = 1n;

/**
 * Negative one value
 * @type {bigint}
 */
export const NEG_ONE = -1n;

/**
 * Size in bytes
 * @type {number}
 */
export const SIZE = 16;

/**
 * Size in bits
 * @type {number}
 */
export const BITS = 128;

/**
 * Modulo value for wrapping: 2^128
 * @type {bigint}
 */
export const MODULO = 2n ** 128n;
