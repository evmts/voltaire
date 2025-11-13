import { MAX } from "./constants.js";

/**
 * Check if value is a valid Uint32
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedUint32.js').BrandedUint32} true if valid Uint32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const result1 = Uint32.isValid(100); // true
 * const result2 = Uint32.isValid(-1); // false
 * const result3 = Uint32.isValid(5000000000); // false (exceeds max)
 * ```
 */
export function isValid(value) {
	if (typeof value !== "number") return false;
	if (!Number.isSafeInteger(value)) return false;
	if (!Number.isInteger(value)) return false;
	if (value < 0) return false;
	if (value > MAX) return false;
	return true;
}
