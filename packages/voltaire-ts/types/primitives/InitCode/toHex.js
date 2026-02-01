import * as Hex from "../Hex/index.js";
/**
 * Convert InitCode to hex string
 *
 * @param {import('./InitCodeType.js').InitCodeType} data - InitCode
 * @returns {import('../Hex/HexType.js').HexType} Hex string
 * @example
 * ```javascript
 * import * as InitCode from './primitives/InitCode/index.js';
 * const code = InitCode.from("0x608060405234801561001057600080fd5b50...");
 * const hex = InitCode._toHex(code);
 * ```
 */
export function toHex(data) {
    return Hex.fromBytes(data);
}
