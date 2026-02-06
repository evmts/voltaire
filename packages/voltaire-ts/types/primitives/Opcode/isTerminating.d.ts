/**
 * Check if opcode terminates execution
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to check
 * @returns {boolean} True if STOP, RETURN, REVERT, INVALID, or SELFDESTRUCT
 *
 * @example
 * ```typescript
 * Opcode.isTerminating(Opcode.RETURN); // true
 * Opcode.isTerminating(Opcode.ADD); // false
 * ```
 */
export function isTerminating(opcode: import("./OpcodeType.js").OpcodeType): boolean;
//# sourceMappingURL=isTerminating.d.ts.map