/**
 * Check if opcode terminates execution
 *
 * @param {import('./BytecodeType.js').Opcode} opcode - Opcode to check
 * @returns {boolean} true if opcode terminates execution
 *
 * @example
 * ```typescript
 * isTerminator(0xf3); // true (RETURN)
 * isTerminator(0xfd); // true (REVERT)
 * isTerminator(0x00); // true (STOP)
 * ```
 */
export function isTerminator(opcode: import("./BytecodeType.js").Opcode): boolean;
//# sourceMappingURL=isTerminator.d.ts.map