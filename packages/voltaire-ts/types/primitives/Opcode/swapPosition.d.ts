/**
 * Get position for SWAP instruction
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {number | undefined} Stack position (1-16), or undefined if not a SWAP
 *
 * @example
 * ```typescript
 * Opcode.swapPosition(Opcode.SWAP1); // 1
 * Opcode.swapPosition(Opcode.SWAP16); // 16
 * Opcode.swapPosition(Opcode.ADD); // undefined
 * ```
 */
export function swapPosition(opcode: import("./OpcodeType.js").OpcodeType): number | undefined;
//# sourceMappingURL=swapPosition.d.ts.map