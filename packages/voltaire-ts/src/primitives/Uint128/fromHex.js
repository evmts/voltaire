import { Uint128NotIntegerError } from "./errors.js";
import { from } from "./from.js";

/**
 * Create Uint128 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {import('./Uint128Type.js').Uint128Type} Uint128 value
 * @throws {Uint128NotIntegerError} If hex string is invalid
 * @throws {import('./errors.js').Uint128OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.fromHex("0xff");
 * const b = Uint128.fromHex("ff");
 * ```
 */
export function fromHex(value) {
	if (typeof value !== "string" || !/^(?:0[xX])?[0-9a-fA-F]+$/.test(value)) {
		throw new Uint128NotIntegerError(`Invalid Uint128 hex string: ${value}`, {
			value,
		});
	}
	const hexValue =
		value.startsWith("0x") || value.startsWith("0X") ? value : `0x${value}`;
	return from(hexValue);
}
