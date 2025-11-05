import { from } from "./from.js";

/**
 * Create Uint256 from number
 *
 * @param {number} value - number to convert
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If value is not an integer or out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromNumber(255);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Error(`Uint256 value must be an integer: ${value}`);
	}
	return from(value);
}
