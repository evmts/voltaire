/**
 * Create Bytes32 from bytes. Input must be exactly 32 bytes.
 *
 * @param {Uint8Array} bytes - Input bytes (must be 32 bytes)
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidBytes32LengthError} If bytes length is not 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array(32);
 * bytes[0] = 1;
 * const b32 = Bytes32.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromBytes.d.ts.map