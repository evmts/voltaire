/**
 * Create Bytes32 from hex string (with or without 0x prefix)
 *
 * @param {string} hex - Hex string (64 chars, with or without 0x prefix)
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidBytes32LengthError} If hex length is not 64 characters
 * @throws {InvalidBytes32HexError} If hex contains invalid characters
 *
 * @example
 * ```typescript
 * const b32 = Bytes32.fromHex('0x' + 'ab'.repeat(32));
 * const b32Alt = Bytes32.fromHex('ab'.repeat(32));
 * ```
 */
export function fromHex(hex: string): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromHex.d.ts.map