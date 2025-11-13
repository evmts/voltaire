/**
 * Uint32 constants
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 */

/**
 * Size in bytes (4 bytes for Uint32)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @type {4}
 * @example
 * ```javascript
 * import { SIZE } from './primitives/Uint32/index.js';
 * console.log(SIZE); // 4
 * ```
 */
export const SIZE = 4;

/**
 * Maximum Uint32 value: 2^32 - 1 = 4294967295
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint32.ts').BrandedUint32}
 * @example
 * ```javascript
 * import { MAX } from './primitives/Uint32/index.js';
 * console.log(MAX); // 4294967295
 * ```
 */
export const MAX = /** @type {import('./BrandedUint32.ts').BrandedUint32} */ (
	4294967295
);

/**
 * Minimum Uint32 value: 0
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint32.ts').BrandedUint32}
 * @example
 * ```javascript
 * import { MIN } from './primitives/Uint32/index.js';
 * console.log(MIN); // 0
 * ```
 */
export const MIN = /** @type {import('./BrandedUint32.ts').BrandedUint32} */ (0);

/**
 * Zero value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint32.ts').BrandedUint32}
 * @example
 * ```javascript
 * import { ZERO } from './primitives/Uint32/index.js';
 * console.log(ZERO); // 0
 * ```
 */
export const ZERO = /** @type {import('./BrandedUint32.ts').BrandedUint32} */ (0);

/**
 * One value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @type {import('./BrandedUint32.ts').BrandedUint32}
 * @example
 * ```javascript
 * import { ONE } from './primitives/Uint32/index.js';
 * console.log(ONE); // 1
 * ```
 */
export const ONE = /** @type {import('./BrandedUint32.ts').BrandedUint32} */ (1);
