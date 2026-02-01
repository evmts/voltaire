/**
 * Analyze bytecode to identify valid JUMPDEST locations
 *
 * This must skip over PUSH instruction immediate data to avoid
 * treating data bytes as instructions.
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Bytecode to analyze
 * @returns {Set<number>} Set of valid JUMPDEST positions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x5b, 0x5b]); // PUSH1 0x5b, JUMPDEST
 * const jumpdests = Bytecode.analyzeJumpDestinations(code);
 * jumpdests.has(1); // false (inside PUSH data)
 * jumpdests.has(2); // true (actual JUMPDEST)
 * ```
 */
export function analyzeJumpDestinations(code: import("./BytecodeType.js").BrandedBytecode): Set<number>;
//# sourceMappingURL=analyzeJumpDestinations.d.ts.map