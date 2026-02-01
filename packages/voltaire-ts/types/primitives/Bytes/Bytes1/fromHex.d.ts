/**
 * Create Bytes1 from hex string with size validation
 *
 * @param {string} hex - Hex string (must be exactly 2 hex chars + 0x prefix)
 * @returns {import('./Bytes1Type.js').Bytes1Type} Bytes1
 * @throws {InvalidBytesLengthError} If length is not 1 byte
 *
 * @example
 * ```typescript
 * const bytes = Bytes1.fromHex("0x12");
 * ```
 */
export function fromHex(hex: string): import("./Bytes1Type.js").Bytes1Type;
//# sourceMappingURL=fromHex.d.ts.map