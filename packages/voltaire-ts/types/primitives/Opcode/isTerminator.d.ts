/**
 * Check if opcode terminates execution (alias for isTerminating)
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to check
 * @returns {boolean} True if STOP, RETURN, REVERT, INVALID, or SELFDESTRUCT
 *
 * @example
 * ```typescript
 * Opcode.isTerminator(Opcode.RETURN); // true
 * Opcode.isTerminator(Opcode.ADD); // false
 * ```
 */
export function isTerminator(opcode: import("./OpcodeType.js").OpcodeType): boolean;
//# sourceMappingURL=isTerminator.d.ts.map