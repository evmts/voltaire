/**
 * Get stack effect for an opcode
 *
 * @param {import('./OpcodeType.js').OpcodeType} opcode - Opcode to query
 * @returns {{ pop: number; push: number } | undefined} Stack items consumed and produced
 *
 * @example
 * ```typescript
 * const effect = Opcode.getStackEffect(Opcode.ADD);
 * // { pop: 2, push: 1 }
 *
 * const effect2 = Opcode.getStackEffect(Opcode.DUP1);
 * // { pop: 1, push: 2 }
 * ```
 */
export function getStackEffect(opcode: import("./OpcodeType.js").OpcodeType): {
    pop: number;
    push: number;
} | undefined;
//# sourceMappingURL=getStackEffect.d.ts.map