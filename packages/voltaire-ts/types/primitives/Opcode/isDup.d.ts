/**
 * Check if opcode is a DUP instruction
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to check
 * @returns {boolean} True if DUP1-DUP16
 *
 * @example
 * ```typescript
 * Opcode.isDup(Opcode.DUP1); // true
 * Opcode.isDup(Opcode.ADD); // false
 * ```
 */
export function isDup(opcode: import("./OpcodeType.js").OpcodeType): boolean;
//# sourceMappingURL=isDup.d.ts.map