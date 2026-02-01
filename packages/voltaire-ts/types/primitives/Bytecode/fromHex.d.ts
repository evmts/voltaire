/**
 * Parse hex string to bytecode
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./BytecodeType.js').BrandedBytecode} Bytecode
 * @throws {InvalidFormatError} If hex string has odd length
 *
 * @example
 * ```typescript
 * const code = Bytecode.fromHex("0x6001");
 * // Uint8Array([0x60, 0x01])
 * ```
 */
export function fromHex(hex: string): import("./BytecodeType.js").BrandedBytecode;
//# sourceMappingURL=fromHex.d.ts.map