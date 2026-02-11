/**
 * Format bytecode as hex string
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Bytecode to format
 * @param {boolean} [prefix=true] - Whether to include 0x prefix
 * @returns {import('../Hex/HexType.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * Bytecode.toHex(code); // "0x6001"
 * Bytecode.toHex(code, false); // "6001"
 * ```
 */
export function toHex(code: import("./BytecodeType.js").BrandedBytecode, prefix?: boolean): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map