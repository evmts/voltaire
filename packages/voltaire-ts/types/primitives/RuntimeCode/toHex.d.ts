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
export function toHex(data: import("./RuntimeCodeType.js").RuntimeCodeType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map