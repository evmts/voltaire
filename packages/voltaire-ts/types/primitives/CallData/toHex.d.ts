/**
 * Convert CallData to hex string with 0x prefix
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to convert
 * @returns {import('../Hex/index.js').HexType} Lowercase hex string with 0x prefix
 *
 * @example
 * ```javascript
 * const calldata = CallData.fromBytes(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
 * console.log(CallData.toHex(calldata)); // "0xa9059cbb"
 * ```
 */
export function toHex(calldata: import("./CallDataType.js").CallDataType): import("../Hex/index.js").HexType;
//# sourceMappingURL=toHex.d.ts.map