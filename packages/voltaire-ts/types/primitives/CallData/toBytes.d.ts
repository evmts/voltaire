/**
 * Return the underlying Uint8Array representation (zero-copy)
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to convert
 * @returns {Uint8Array} Raw byte array (shares underlying buffer)
 *
 * @example
 * ```javascript
 * const calldata = CallData.from("0xa9059cbb");
 * const bytes = CallData.toBytes(calldata);
 * console.log(bytes.length); // 4
 * ```
 */
export function toBytes(calldata: import("./CallDataType.js").CallDataType): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map