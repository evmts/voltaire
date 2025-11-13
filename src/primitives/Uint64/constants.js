/**
 * Uint64 constants
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 */

/**
 * Size in bytes (8 bytes for Uint64)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @type {8}
 * @example
 * ```javascript
 * import { SIZE } from './primitives/Uint64/index.js';
 * console.log(SIZE); // 8
 * ```
 */
export const SIZE = 8;

/**
 * Maximum Uint64 value: 2^64 - 1 = 18446744073709551615n
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint64.ts').BrandedUint64}
 * @example
 * ```javascript
 * import { MAX } from './primitives/Uint64/index.js';
 * console.log(MAX); // 18446744073709551615n
 * ```
 */
export const MAX = /** @type {import('./BrandedUint64.ts').BrandedUint64} */ (
	18446744073709551615n
);

/**
 * Minimum Uint64 value: 0n
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint64.ts').BrandedUint64}
 * @example
 * ```javascript
 * import { MIN } from './primitives/Uint64/index.js';
 * console.log(MIN); // 0n
 * ```
 */
export const MIN = /** @type {import('./BrandedUint64.ts').BrandedUint64} */ (
	0n
);

/**
 * Zero value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint64.ts').BrandedUint64}
 * @example
 * ```javascript
 * import { ZERO } from './primitives/Uint64/index.js';
 * console.log(ZERO); // 0n
 * ```
 */
export const ZERO = /** @type {import('./BrandedUint64.ts').BrandedUint64} */ (
	0n
);

/**
 * One value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint64.ts').BrandedUint64}
 * @example
 * ```javascript
 * import { ONE } from './primitives/Uint64/index.js';
 * console.log(ONE); // 1n
 * ```
 */
export const ONE = /** @type {import('./BrandedUint64.ts').BrandedUint64} */ (
	1n
);
