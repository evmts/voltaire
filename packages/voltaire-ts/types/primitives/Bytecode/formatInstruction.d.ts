/**
 * Format instruction to human-readable string
 *
 * @param {import('./BytecodeType.js').Instruction} instruction - Instruction to format
 * @returns {string} Human-readable string
 *
 * @example
 * ```typescript
 * const inst = { opcode: 0x60, position: 0, pushData: new Uint8Array([0x01]) };
 * Bytecode.formatInstruction(inst); // "0x0000: PUSH1 0x01"
 * ```
 */
export function formatInstruction(instruction: import("./BytecodeType.js").Instruction): string;
//# sourceMappingURL=formatInstruction.d.ts.map