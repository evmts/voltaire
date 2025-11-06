/**
 * Uint256 constants
 */

/**
 * Size in bytes (32 bytes for Uint256)
 * @type {32}
 */
export const SIZE = 32;

/**
 * Maximum Uint256 value: 2^256 - 1
 * @type {import('./BrandedUint.ts').BrandedUint}
 */
export const MAX = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
	(1n << 256n) - 1n
);

/**
 * Minimum Uint256 value: 0
 * @type {import('./BrandedUint.ts').BrandedUint}
 */
export const MIN = /** @type {import('./BrandedUint.ts').BrandedUint} */ (0n);

/**
 * Zero value
 * @type {import('./BrandedUint.ts').BrandedUint}
 */
export const ZERO = /** @type {import('./BrandedUint.ts').BrandedUint} */ (0n);

/**
 * One value
 * @type {import('./BrandedUint.ts').BrandedUint}
 */
export const ONE = /** @type {import('./BrandedUint.ts').BrandedUint} */ (1n);
