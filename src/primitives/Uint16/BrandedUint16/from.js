import { MAX } from "./constants.js";

/**
 * Create Uint16 from number or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {number | string} value - number or decimal/hex string
 * @returns {import('./BrandedUint16.js').BrandedUint16} Uint16 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(1000);
 * const b = Uint16.from("65535");
 * const c = Uint16.from("0xffff");
 * ```
 */
export function from(value) {
	let numValue;

	if (typeof value === "string") {
		if (value.startsWith("0x") || value.startsWith("0X")) {
			numValue = Number.parseInt(value, 16);
		} else {
			numValue = Number.parseInt(value, 10);
		}
		if (Number.isNaN(numValue)) {
			throw new Error(`Invalid Uint16 string: ${value}`);
		}
	} else {
		numValue = value;
	}

	if (!Number.isInteger(numValue)) {
		throw new Error(`Uint16 value must be an integer: ${numValue}`);
	}

	if (numValue < 0) {
		throw new Error(`Uint16 value cannot be negative: ${numValue}`);
	}

	if (numValue > MAX) {
		throw new Error(`Uint16 value exceeds maximum (65535): ${numValue}`);
	}

	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (numValue);
}
