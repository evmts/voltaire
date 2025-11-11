import type { BrandedUint } from "./BrandedUint.js";

/**
 * Size in bytes (32 bytes for Uint256)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const SIZE = 32;

/**
 * Maximum Uint256 value: 2^256 - 1
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const MAX: BrandedUint = ((1n << 256n) - 1n) as BrandedUint;

/**
 * Minimum Uint256 value: 0
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const MIN: BrandedUint = 0n as BrandedUint;

/**
 * Zero value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const ZERO: BrandedUint = 0n as BrandedUint;

/**
 * One value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const ONE: BrandedUint = 1n as BrandedUint;
