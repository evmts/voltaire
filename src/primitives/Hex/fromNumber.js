import { NegativeNumberError, NonIntegerError, UnsafeIntegerError } from "./errors.js";

/**
 * Convert number to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {number} value - Number to convert (must be safe integer)
 * @param {number} [size] - Optional byte size for padding
 * @returns {import('./HexType.js').HexType} Hex string
 * @throws {NegativeNumberError} If value is negative
 * @throws {UnsafeIntegerError} If value exceeds Number.MAX_SAFE_INTEGER
 * @throws {NonIntegerError} If value is not an integer
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromNumber(255);     // '0xff'
 * Hex.fromNumber(255, 2);  // '0x00ff'
 * Hex.fromNumber(0x1234);  // '0x1234'
 * ```
 */
export function fromNumber(value, size) {
	if (value < 0) {
		throw new NegativeNumberError(`Number must be non-negative. Got: ${value}`, {
			value,
		});
	}
	if (value > Number.MAX_SAFE_INTEGER) {
		throw new UnsafeIntegerError(
			`Number exceeds MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER}). Use Hex.fromBigInt() for larger values.`,
			{ value },
		);
	}
	if (!Number.isInteger(value)) {
		throw new NonIntegerError(`Number must be an integer. Got: ${value}`, {
			value,
		});
	}
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return /** @type {import('./HexType.js').HexType} */ (`0x${hex}`);
}
