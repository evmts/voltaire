/**
 * Get PUSH opcode for given byte count
 *
 * @param {number} bytes - Number of bytes (0-32)
 * @returns {import('./OpcodeType.js').OpcodeType} PUSH opcode for that size
 * @throws {InvalidRangeError} If bytes is not 0-32
 *
 * @example
 * ```typescript
 * Opcode.pushOpcode(1); // Opcode.PUSH1
 * Opcode.pushOpcode(32); // Opcode.PUSH32
 * Opcode.pushOpcode(0); // Opcode.PUSH0
 * ```
 */
export function pushOpcode(bytes: number): import("./OpcodeType.js").OpcodeType;
//# sourceMappingURL=pushOpcode.d.ts.map