import { from } from "./from.js";

/**
 * Create Uint128 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {import('./BrandedUint128.js').BrandedUint128} Uint128 value
 * @throws {Error} If value is invalid or out of range
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.fromHex("0xff");
 * const b = Uint128.fromHex("ff");
 * ```
 */
export function fromHex(value) {
	const hexValue = value.startsWith("0x") ? value : `0x${value}`;
	return from(hexValue);
}
