/**
 * Get number of stack items consumed by an opcode
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {number | undefined} Number of stack items consumed
 *
 * @example
 * ```typescript
 * const inputs = Opcode.getStackInput(Opcode.ADD); // 2
 * const inputs2 = Opcode.getStackInput(Opcode.PUSH1); // 0
 * ```
 */
export function getStackInput(opcode: import("./OpcodeType.js").OpcodeType): number | undefined;
//# sourceMappingURL=getStackInput.d.ts.map