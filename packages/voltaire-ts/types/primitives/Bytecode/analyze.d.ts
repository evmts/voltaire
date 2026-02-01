/**
 * Perform complete bytecode analysis
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Bytecode to analyze
 * @returns {import('./BytecodeType.js').Analysis} Complete analysis result
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]);
 * const analysis = Bytecode.analyze(code);
 * // {
 * //   valid: true,
 * //   jumpDestinations: Set([2]),
 * //   instructions: [...],
 * // }
 * ```
 */
export function analyze(code: import("./BytecodeType.js").BrandedBytecode): import("./BytecodeType.js").Analysis;
//# sourceMappingURL=analyze.d.ts.map