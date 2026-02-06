import * as Hex from "../Hex/index.js";

/**
 * Convert ContractCode to hex string
 *
 * @param {import('./ContractCodeType.js').ContractCodeType} data - ContractCode
 * @returns {import('../Hex/HexType.js').HexType} Hex string
 * @example
 * ```javascript
 * import * as ContractCode from './primitives/ContractCode/index.js';
 * const code = ContractCode.from("0x6001600155");
 * const hex = ContractCode._toHex(code); // "0x6001600155"
 * ```
 */
export function toHex(data) {
	return Hex.fromBytes(data);
}
