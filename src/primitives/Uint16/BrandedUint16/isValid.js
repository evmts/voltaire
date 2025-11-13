import { MAX } from "./constants.js";

/**
 * Check if value is a valid Uint16
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedUint16.js').BrandedUint16} true if valid Uint16
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * Uint16.isValid(30000); // true
 * Uint16.isValid(65535); // true
 * Uint16.isValid(65536); // false
 * Uint16.isValid(-1); // false
 * Uint16.isValid(1.5); // false
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
