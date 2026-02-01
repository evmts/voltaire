/**
 * Create CallData from Uint8Array (zero-copy)
 *
 * @param {Uint8Array} bytes - Raw byte array representing calldata
 * @returns {import('./CallDataType.js').CallDataType} Branded CallData
 * @throws {InvalidCallDataLengthError} If bytes length is less than 4
 *
 * @example
 * ```javascript
 * const bytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
 * const calldata = CallData.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./CallDataType.js").CallDataType;
//# sourceMappingURL=fromBytes.d.ts.map