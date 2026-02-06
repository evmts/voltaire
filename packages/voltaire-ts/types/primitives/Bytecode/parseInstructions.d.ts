/**
 * Parse bytecode into instructions
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Bytecode to parse
 * @returns {import('./BytecodeType.js').Instruction[]} Array of instructions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = Bytecode.parseInstructions(code);
 * // [
 * //   { opcode: 0x60, position: 0, pushData: Uint8Array([0x01]) },
 * //   { opcode: 0x60, position: 2, pushData: Uint8Array([0x02]) },
 * //   { opcode: 0x01, position: 4 }
 * // ]
 * ```
 */
export function parseInstructions(code: import("./BytecodeType.js").BrandedBytecode): import("./BytecodeType.js").Instruction[];
//# sourceMappingURL=parseInstructions.d.ts.map