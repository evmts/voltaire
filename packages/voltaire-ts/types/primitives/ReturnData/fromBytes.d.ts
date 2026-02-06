/**
 * Create ReturnData from Uint8Array (zero-copy cast)
 *
 * @param {Uint8Array} value - Byte array
 * @returns {import('./ReturnDataType.js').ReturnDataType} ReturnData
 *
 * @example
 * ```typescript
 * const data = ReturnData.fromBytes(new Uint8Array([0, 0, 0, 1]));
 * ```
 */
export function fromBytes(value: Uint8Array): import("./ReturnDataType.js").ReturnDataType;
//# sourceMappingURL=fromBytes.d.ts.map