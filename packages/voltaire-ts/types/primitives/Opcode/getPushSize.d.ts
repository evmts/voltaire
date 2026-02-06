/**
 * Get PUSH data size in bytes
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {number} Push size (0 for PUSH0, 1-32 for PUSH1-PUSH32, 0 for non-PUSH)
 *
 * @example
 * ```typescript
 * Opcode.getPushSize(Opcode.PUSH0); // 0
 * Opcode.getPushSize(Opcode.PUSH1); // 1
 * Opcode.getPushSize(Opcode.PUSH32); // 32
 * Opcode.getPushSize(Opcode.ADD); // 0
 * ```
 */
export function getPushSize(opcode: import("./OpcodeType.js").OpcodeType): number;
//# sourceMappingURL=getPushSize.d.ts.map