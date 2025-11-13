import { MAX } from "./constants.js";

/**
 * Create Uint8 from number or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {number | string} value - number or decimal/hex string
 * @returns {import('./BrandedUint8.js').BrandedUint8} Uint8 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from("255");
 * const c = Uint8.from("0xff");
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
			throw new Error(`Invalid Uint8 string: ${value}`);
		}
	} else {
		numValue = value;
	}

	if (!Number.isInteger(numValue)) {
		throw new Error(`Uint8 value must be an integer: ${numValue}`);
	}

	if (numValue < 0) {
		throw new Error(`Uint8 value cannot be negative: ${numValue}`);
	}

	if (numValue > MAX) {
		throw new Error(`Uint8 value exceeds maximum (255): ${numValue}`);
	}

	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (numValue);
}
