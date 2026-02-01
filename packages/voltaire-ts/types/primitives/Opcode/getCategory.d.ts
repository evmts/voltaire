/**
 * Get opcode category
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {string} Category name
 *
 * @example
 * ```typescript
 * Opcode.getCategory(Opcode.ADD); // "arithmetic"
 * Opcode.getCategory(Opcode.SSTORE); // "storage"
 * Opcode.getCategory(Opcode.CALL); // "system"
 * ```
 */
export function getCategory(opcode: import("./OpcodeType.js").OpcodeType): string;
//# sourceMappingURL=getCategory.d.ts.map