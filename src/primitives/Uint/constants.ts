import type { Uint256Type } from "./Uint256Type.js";

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
export const MAX: Uint256Type = ((1n << 256n) - 1n) as Uint256Type;

/**
 * Minimum Uint256 value: 0
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const MIN: Uint256Type = 0n as Uint256Type;

/**
 * Zero value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const ZERO: Uint256Type = 0n as Uint256Type;

/**
 * One value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export const ONE: Uint256Type = 1n as Uint256Type;
