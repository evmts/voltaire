/**
 * Analyze bytecode into basic blocks with control flow
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode
 * @param {import('./BytecodeType.js').BlockAnalysisOptions} [options]
 * @returns {Array<import('./BytecodeType.js').BasicBlock>}
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x60016002015b00");
 * const blocks = Bytecode.analyzeBlocks(code, {
 *   buildCFG: true,
 *   computeReachability: true,
 *   includeUnreachable: false
 * });
 * ```
 */
export function analyzeBlocks(bytecode: import("./BytecodeType.js").BrandedBytecode, options?: import("./BytecodeType.js").BlockAnalysisOptions): Array<import("./BytecodeType.js").BasicBlock>;
//# sourceMappingURL=analyzeBlocks.d.ts.map