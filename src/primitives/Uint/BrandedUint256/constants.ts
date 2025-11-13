import type { BrandedUint256 } from "./BrandedUint256.js";

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
export const MAX: BrandedUint256 = ((1n << 256n) - 1n) as BrandedUint256;

/**
 * Minimum Uint256 value: 0
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const MIN: BrandedUint256 = 0n as BrandedUint256;

/**
 * Zero value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const ZERO: BrandedUint256 = 0n as BrandedUint256;

/**
 * One value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const ONE: BrandedUint256 = 1n as BrandedUint256;
