import { MAX } from "./constants.js";

/**
 * Check if value is a valid Uint8
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedUint8.js').BrandedUint8} true if valid Uint8
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.isValid(100); // true
 * Uint8.isValid(255); // true
 * Uint8.isValid(256); // false
 * Uint8.isValid(-1); // false
 * Uint8.isValid(1.5); // false
 * ```
 */
export function isValid(value) {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value >= 0 &&
		value <= MAX
	);
}
