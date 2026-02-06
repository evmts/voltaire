/**
 * Get next program counter after executing instruction at currentPc
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode
 * @param {number} currentPc - Current program counter
 * @returns {number | undefined} Next PC, or undefined if at/beyond end
 *
 * @example
 * ```typescript
 * const bytecode = Bytecode("0x6001");  // PUSH1 0x01
 * getNextPc(bytecode, 0);  // 2 (PUSH1 = 1 byte opcode + 1 byte data)
 *
 * const bytecode2 = Bytecode("0x01");   // ADD
 * getNextPc(bytecode2, 0); // undefined (would be at EOF)
 * ```
 */
export function getNextPc(bytecode: import("./BytecodeType.js").BrandedBytecode, currentPc: number): number | undefined;
//# sourceMappingURL=getNextPc.d.ts.map