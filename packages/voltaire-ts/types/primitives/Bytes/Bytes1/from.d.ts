/**
 * Create Bytes1 from various input types with size validation
 *
 * @param {Uint8Array | string} value - Uint8Array, hex string, or UTF-8 string (must be exactly 1 byte)
 * @returns {import('./Bytes1Type.js').Bytes1Type} Bytes1
 * @throws {InvalidBytesLengthError} If length is not 1 byte
 *
 * @example
 * ```typescript
 * const b1 = Bytes1.from(new Uint8Array([0x12]));
 * const b2 = Bytes1.from("0x12");
 * ```
 */
export function from(value: Uint8Array | string): import("./Bytes1Type.js").Bytes1Type;
//# sourceMappingURL=from.d.ts.map