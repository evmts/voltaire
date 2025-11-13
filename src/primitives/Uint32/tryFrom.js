import { isValid } from "./isValid.js";

/**
 * Try to create Uint32 from value, return null if invalid
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {unknown} value - Value to convert
 * @returns {import('./BrandedUint32.js').BrandedUint32 | null} Uint32 value or null
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.tryFrom(100); // 100
 * const b = Uint32.tryFrom(-1); // null
 * const c = Uint32.tryFrom(5000000000); // null
 * ```
 */
export function tryFrom(value) {
	if (isValid(value)) {
		return /** @type {import('./BrandedUint32.js').BrandedUint32} */ (value);
	}
	return null;
}
