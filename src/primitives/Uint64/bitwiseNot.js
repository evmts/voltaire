import { MAX } from "./constants.js";

/**
 * Bitwise NOT Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Operand
 * @returns {import('./BrandedUint64.js').BrandedUint64} Result (~uint)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(0n);
 * const result = Uint64.bitwiseNot(a); // 18446744073709551615n (all bits set)
 * ```
 */
export function bitwiseNot(uint) {
	return MAX ^ uint;
}
