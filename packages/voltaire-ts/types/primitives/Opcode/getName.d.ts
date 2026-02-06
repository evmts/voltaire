/**
 * Get mnemonic name of an opcode (alias for name)
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {string} Opcode name or "UNKNOWN" if invalid
 *
 * @example
 * ```typescript
 * const name = Opcode.getName(Opcode.ADD); // "ADD"
 * const name2 = Opcode.getName(0xFF); // "SELFDESTRUCT"
 * ```
 */
export function getName(opcode: import("./OpcodeType.js").OpcodeType): string;
//# sourceMappingURL=getName.d.ts.map