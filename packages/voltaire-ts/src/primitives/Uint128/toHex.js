/**
 * Convert Uint128 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Uint128 value
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.from(255n);
 * const hex = Uint128.toHex(value); // "0xff"
 * ```
 */
export function toHex(uint) {
	return /** @type {import('../Hex/HexType.js').HexType} */ (`0x${uint.toString(16)}`);
}
