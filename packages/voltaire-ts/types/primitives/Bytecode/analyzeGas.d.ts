/**
 * Analyze gas costs in bytecode
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode - Bytecode to analyze
 * @param {import('./BytecodeType.js').GasAnalysisOptions} [options] - Analysis options
 * @returns {import('./BytecodeType.js').GasAnalysis} Gas analysis result
 *
 * @example
 * ```typescript
 * const code = Bytecode.fromHex('0x6001600201');
 * const analysis = Bytecode.analyzeGas(code);
 * console.log(analysis.total); // 9n
 * console.log(analysis.byInstruction); // Per-instruction breakdown
 * ```
 */
export function analyzeGas(bytecode: import("./BytecodeType.js").BrandedBytecode, options?: import("./BytecodeType.js").GasAnalysisOptions): import("./BytecodeType.js").GasAnalysis;
//# sourceMappingURL=analyzeGas.d.ts.map