/**
 * Get basic block containing the given program counter
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode
 * @param {number} pc - Program counter position
 * @returns {import('./BytecodeType.js').BasicBlock | undefined}
 *
 * @example
 * ```typescript
 * const bytecode = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
 * const block = Bytecode.getBlock(bytecode, 0);
 * // { index: 0, startPc: 0, endPc: 3, ... }
 * ```
 */
export function getBlock(bytecode: import("./BytecodeType.js").BrandedBytecode, pc: number): import("./BytecodeType.js").BasicBlock | undefined;
//# sourceMappingURL=getBlock.d.ts.map