/**
 * Get metadata for an opcode
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {import('./OpcodeType.js').Info | undefined} Metadata with gas cost and stack requirements
 *
 * @example
 * ```typescript
 * const info = Opcode.info(Opcode.ADD);
 * console.log(info?.name); // "ADD"
 * console.log(info?.gasCost); // 3
 * ```
 */
export function info(opcode: import("./OpcodeType.js").OpcodeType): import("./OpcodeType.js").Info | undefined;
//# sourceMappingURL=info.d.ts.map