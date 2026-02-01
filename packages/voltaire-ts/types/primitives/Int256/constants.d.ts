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
export const MIN: bigint;
/**
 * Maximum Int256 value: 2^255 - 1
 * EVM: 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * @type {bigint}
 */
export const MAX: bigint;
/**
 * Zero value
 * @type {bigint}
 */
export const ZERO: bigint;
/**
 * One value
 * @type {bigint}
 */
export const ONE: bigint;
/**
 * Negative one value (-1 in two's complement)
 * EVM: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * @type {bigint}
 */
export const NEG_ONE: bigint;
/**
 * Size in bytes
 * @type {number}
 */
export const SIZE: number;
/**
 * Size in bits
 * @type {number}
 */
export const BITS: number;
/**
 * Modulo value for wrapping: 2^256
 * @type {bigint}
 */
export const MODULO: bigint;
//# sourceMappingURL=constants.d.ts.map