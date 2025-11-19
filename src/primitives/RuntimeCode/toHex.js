import * as Hex from "../Hex/index.js";

/**
 * Convert RuntimeCode to hex string
 *
 * @param {import('./RuntimeCodeType.js').RuntimeCodeType} data - RuntimeCode
 * @returns {import('../Hex/HexType.js').HexType} Hex string
 * @example
 * ```javascript
 * import * as RuntimeCode from './primitives/RuntimeCode/index.js';
 * const code = RuntimeCode.from("0x6001600155");
 * const hex = RuntimeCode._toHex(code);
 * ```
 */
export function toHex(data) {
	return Hex.fromBytes(data);
}
