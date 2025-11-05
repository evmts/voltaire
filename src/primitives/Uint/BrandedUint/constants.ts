import type { BrandedUint as Type } from "./BrandedUint.js";

/**
 * Size in bytes (32 bytes for Uint256)
 */
export const SIZE = 32;

/**
 * Maximum Uint256 value: 2^256 - 1
 */
export const MAX: Type = ((1n << 256n) - 1n) as Type;

/**
 * Minimum Uint256 value: 0
 */
export const MIN: Type = 0n as Type;

/**
 * Zero value
 */
export const ZERO: Type = 0n as Type;

/**
 * One value
 */
export const ONE: Type = 1n as Type;
