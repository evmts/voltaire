/**
 * Get position for DUP instruction
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {number | undefined} Stack position (1-16), or undefined if not a DUP
 *
 * @example
 * ```typescript
 * Opcode.dupPosition(Opcode.DUP1); // 1
 * Opcode.dupPosition(Opcode.DUP16); // 16
 * Opcode.dupPosition(Opcode.ADD); // undefined
 * ```
 */
export function dupPosition(opcode: import("./OpcodeType.js").OpcodeType): number | undefined;
//# sourceMappingURL=dupPosition.d.ts.map