import { MAX } from "./constants.js";

/**
 * Multiply Uint64 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - First operand
 * @param {import('./BrandedUint64.js').BrandedUint64} b - Second operand
 * @returns {import('./BrandedUint64.js').BrandedUint64} Product (uint * b) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(50n);
 * const product = Uint64.times(a, b); // 5000n
 * ```
 */
export function times(uint, b) {
	const product = uint * b;
	return product & MAX;
}
