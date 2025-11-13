/**
 * Uint128 constants
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 */

/**
 * Size in bytes (16 bytes for Uint128)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @type {16}
 * @example
 * ```javascript
 * import { SIZE } from './primitives/Uint128/index.js';
 * console.log(SIZE); // 16
 * ```
 */
export const SIZE = 16;

/**
 * Maximum Uint128 value: 2^128 - 1
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint128.ts').BrandedUint128}
 * @example
 * ```javascript
 * import { MAX } from './primitives/Uint128/index.js';
 * console.log(MAX); // 340282366920938463463374607431768211455n
 * ```
 */
export const MAX = /** @type {import('./BrandedUint128.ts').BrandedUint128} */ (
	(1n << 128n) - 1n
);

/**
 * Minimum Uint128 value: 0
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint128.ts').BrandedUint128}
 * @example
 * ```javascript
 * import { MIN } from './primitives/Uint128/index.js';
 * console.log(MIN); // 0n
 * ```
 */
export const MIN = /** @type {import('./BrandedUint128.ts').BrandedUint128} */ (
	0n
);

/**
 * Zero value
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint128.ts').BrandedUint128}
 * @example
 * ```javascript
 * import { ZERO } from './primitives/Uint128/index.js';
 * console.log(ZERO); // 0n
 * ```
 */
export const ZERO =
	/** @type {import('./BrandedUint128.ts').BrandedUint128} */ (0n);

/**
 * One value
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint128.ts').BrandedUint128}
 * @example
 * ```javascript
 * import { ONE } from './primitives/Uint128/index.js';
 * console.log(ONE); // 1n
 * ```
 */
export const ONE = /** @type {import('./BrandedUint128.ts').BrandedUint128} */ (
	1n
);
