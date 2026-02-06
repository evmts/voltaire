/**
 * Create CallData from various input types (universal constructor)
 *
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./CallDataType.js').CallDataType} Branded CallData
 * @throws {InvalidValueError} If value type is unsupported
 * @throws {InvalidHexFormatError} If hex string is invalid
 * @throws {InvalidCallDataLengthError} If bytes length is less than 4
 *
 * @example
 * ```javascript
 * // From hex string
 * const calldata1 = CallData.from("0xa9059cbb...");
 *
 * // From Uint8Array
 * const calldata2 = CallData.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
 *
 * // Idempotent - returns same instance
 * const calldata3 = CallData.from(calldata1);
 * console.log(calldata1 === calldata3); // true
 * ```
 */
export function from(value: string | Uint8Array): import("./CallDataType.js").CallDataType;
//# sourceMappingURL=from.d.ts.map