/**
 * Get PUSH instruction size (number of bytes pushed)
 *
 * @param {import('./BytecodeType.js').Opcode} opcode - PUSH opcode
 * @returns {number} Number of bytes (1-32), or 0 if not a PUSH
 *
 * @example
 * ```typescript
 * getPushSize(0x60); // 1 (PUSH1)
 * getPushSize(0x7f); // 32 (PUSH32)
 * ```
 */
export function getPushSize(opcode: import("./BytecodeType.js").Opcode): number;
//# sourceMappingURL=getPushSize.d.ts.map