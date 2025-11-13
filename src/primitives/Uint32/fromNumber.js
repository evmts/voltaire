import { MAX } from "./constants.js";

/**
 * Create Uint32 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./BrandedUint32.js').BrandedUint32} Uint32 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.fromNumber(42);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isSafeInteger(value)) {
		throw new Error(`Uint32 value must be a safe integer: ${value}`);
	}

	if (!Number.isInteger(value)) {
		throw new Error(`Uint32 value must be an integer: ${value}`);
	}

	if (value < 0) {
		throw new Error(`Uint32 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint32 value exceeds maximum: ${value}`);
	}

	return value;
}
