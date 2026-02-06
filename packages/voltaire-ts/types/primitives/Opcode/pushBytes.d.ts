/**
 * Get number of bytes pushed by PUSH instruction
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {number | undefined} Number of bytes (0-32), or undefined if not a PUSH
 *
 * @example
 * ```typescript
 * Opcode.pushBytes(Opcode.PUSH1); // 1
 * Opcode.pushBytes(Opcode.PUSH32); // 32
 * Opcode.pushBytes(Opcode.PUSH0); // 0
 * Opcode.pushBytes(Opcode.ADD); // undefined
 * ```
 */
export function pushBytes(opcode: import("./OpcodeType.js").OpcodeType): number | undefined;
//# sourceMappingURL=pushBytes.d.ts.map