/**
 * Build blocks from instructions
 * @param {Array<import('./BytecodeType.js').Instruction>} instructions
 * @param {Set<number>} boundaries
 * @param {Set<number>} jumpDests
 * @returns {Array<import('./BytecodeType.js').BasicBlock>}
 */
export function buildBlocks(instructions: Array<import("./BytecodeType.js").Instruction>, boundaries: Set<number>, _jumpDests: any): Array<import("./BytecodeType.js").BasicBlock>;
//# sourceMappingURL=buildBlocks.d.ts.map