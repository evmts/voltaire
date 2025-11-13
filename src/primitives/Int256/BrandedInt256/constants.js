/**
 * Int256 constants (EVM signed integer type)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 */

/**
 * Minimum Int256 value: -2^255
 * EVM: 0x8000000000000000000000000000000000000000000000000000000000000000
 * @type {bigint}
 */
export const MIN = -(2n ** 255n);

/**
 * Maximum Int256 value: 2^255 - 1
 * EVM: 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * @type {bigint}
 */
export const MAX = 2n ** 255n - 1n;

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
 * Negative one value (-1 in two's complement)
 * EVM: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * @type {bigint}
 */
export const NEG_ONE = -1n;

/**
 * Size in bytes
 * @type {number}
 */
export const SIZE = 32;

/**
 * Size in bits
 * @type {number}
 */
export const BITS = 256;

/**
 * Modulo value for wrapping: 2^256
 * @type {bigint}
 */
export const MODULO = 2n ** 256n;
