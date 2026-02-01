/**
 * Format instruction to human-readable string
 *
 * @param {import('./OpcodeType.js').Instruction} instruction - Instruction to format
 * @returns {string} Human-readable string
 *
 * @example
 * ```typescript
 * const inst = {
 *   offset: 0,
 *   opcode: Opcode.PUSH1,
 *   immediate: new Uint8Array([0x42])
 * };
 * Opcode.format(inst); // "0x0000: PUSH1 0x42"
 * ```
 */
export function format(instruction: import("./OpcodeType.js").Instruction): string;
//# sourceMappingURL=format.d.ts.map