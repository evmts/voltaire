/**
 * Check if opcode is JUMPDEST
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to check
 * @returns {boolean} True if JUMPDEST
 *
 * @example
 * ```typescript
 * Opcode.isJumpDestination(Opcode.JUMPDEST); // true
 * Opcode.isJumpDestination(Opcode.JUMP); // false
 * ```
 */
export function isJumpDestination(opcode: import("./OpcodeType.js").OpcodeType): boolean;
//# sourceMappingURL=isJumpDestination.d.ts.map