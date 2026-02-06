/**
 * Get number of topics for LOG instruction
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {number | undefined} Number of topics (0-4), or undefined if not a LOG
 *
 * @example
 * ```typescript
 * Opcode.logTopics(Opcode.LOG0); // 0
 * Opcode.logTopics(Opcode.LOG4); // 4
 * Opcode.logTopics(Opcode.ADD); // undefined
 * ```
 */
export function logTopics(opcode: import("./OpcodeType.js").OpcodeType): number | undefined;
//# sourceMappingURL=logTopics.d.ts.map