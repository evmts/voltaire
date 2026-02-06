/**
 * Get human-readable description of an opcode
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {string} Description or generated description for PUSH/DUP/SWAP
 *
 * @example
 * ```typescript
 * const desc = Opcode.getDescription(Opcode.ADD);
 * // "Addition operation"
 *
 * const desc2 = Opcode.getDescription(Opcode.PUSH1);
 * // "Place 1-byte item on stack"
 * ```
 */
export function getDescription(opcode: import("./OpcodeType.js").OpcodeType): string;
//# sourceMappingURL=getDescription.d.ts.map