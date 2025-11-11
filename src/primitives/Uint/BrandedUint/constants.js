/**
 * Uint256 constants
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */

/**
 * Size in bytes (32 bytes for Uint256)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @type {32}
 * @example
 * ```javascript
 * import { SIZE } from './primitives/Uint/index.js';
 * console.log(SIZE); // 32
 * ```
 */
export const SIZE = 32;

/**
 * Maximum Uint256 value: 2^256 - 1
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @type {import('./BrandedUint.ts').BrandedUint}
 * @example
 * ```javascript
 * import { MAX } from './primitives/Uint/index.js';
 * console.log(MAX); // 115792089237316195423570985008687907853269984665640564039457584007913129639935n
 * ```
 */
export const MAX = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
	(1n << 256n) - 1n
);

/**
 * Minimum Uint256 value: 0
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @type {import('./BrandedUint.ts').BrandedUint}
 * @example
 * ```javascript
 * import { MIN } from './primitives/Uint/index.js';
 * console.log(MIN); // 0n
 * ```
 */
export const MIN = /** @type {import('./BrandedUint.ts').BrandedUint} */ (0n);

/**
 * Zero value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @type {import('./BrandedUint.ts').BrandedUint}
 * @example
 * ```javascript
 * import { ZERO } from './primitives/Uint/index.js';
 * console.log(ZERO); // 0n
 * ```
 */
export const ZERO = /** @type {import('./BrandedUint.ts').BrandedUint} */ (0n);

/**
 * One value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @type {import('./BrandedUint.ts').BrandedUint}
 * @example
 * ```javascript
 * import { ONE } from './primitives/Uint/index.js';
 * console.log(ONE); // 1n
 * ```
 */
export const ONE = /** @type {import('./BrandedUint.ts').BrandedUint} */ (1n);
