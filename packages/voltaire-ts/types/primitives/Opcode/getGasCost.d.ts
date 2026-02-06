/**
 * Get static gas cost for an opcode
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {number | undefined} Static gas cost or undefined if invalid
 *
 * @example
 * ```typescript
 * const gas = Opcode.getGasCost(Opcode.ADD); // 3
 * const gas2 = Opcode.getGasCost(Opcode.SSTORE); // 100 (base cost, may be higher at runtime)
 * ```
 */
export function getGasCost(opcode: import("./OpcodeType.js").OpcodeType): number | undefined;
//# sourceMappingURL=getGasCost.d.ts.map