import { MAX } from "./constants.js";

/**
 * Create Uint16 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./BrandedUint16.js').BrandedUint16} Uint16 value
 * @throws {Error} If value is out of range or not an integer
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.fromNumber(65535);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Error(`Uint16 value must be an integer: ${value}`);
	}

	if (value < 0) {
		throw new Error(`Uint16 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint16 value exceeds maximum (65535): ${value}`);
	}

	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (value);
}
