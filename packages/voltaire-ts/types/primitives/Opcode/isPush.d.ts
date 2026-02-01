/**
 * Check if opcode is a PUSH instruction
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to check
 * @returns {boolean} True if PUSH0-PUSH32
 *
 * @example
 * ```typescript
 * Opcode.isPush(Opcode.PUSH1); // true
 * Opcode.isPush(Opcode.ADD); // false
 * ```
 */
export function isPush(opcode: import("./OpcodeType.js").OpcodeType): boolean;
//# sourceMappingURL=isPush.d.ts.map