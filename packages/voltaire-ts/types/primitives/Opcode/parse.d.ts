/**
 * Parse bytecode into instructions
 *
 * @param {Uint8Array} bytecode - Raw bytecode bytes
 * @returns {import('./OpcodeType.js').Instruction[]} Array of parsed instructions
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = Opcode.parse(bytecode);
 * // [
 * //   { offset: 0, opcode: PUSH1, immediate: [0x01] },
 * //   { offset: 2, opcode: PUSH1, immediate: [0x02] },
 * //   { offset: 4, opcode: ADD }
 * // ]
 * ```
 */
export function parse(bytecode: Uint8Array): import("./OpcodeType.js").Instruction[];
//# sourceMappingURL=parse.d.ts.map