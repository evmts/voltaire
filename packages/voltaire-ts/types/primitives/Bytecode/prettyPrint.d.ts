/**
 * Pretty print bytecode disassembly
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode
 * @param {import('./BytecodeType.js').PrettyPrintOptions} [options]
 * @returns {string}
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x6001600201");
 * console.log(Bytecode.prettyPrint(code));
 * // ┌─────────────────────────────────────┐
 * // │   EVM Bytecode Disassembly          │
 * // │   Size: 5 bytes                     │
 * // │   Gas: 9                            │
 * // └─────────────────────────────────────┘
 * //
 * //  PC   Opcode     Value          Gas  Stack
 * // ──────────────────────────────────────────
 * // 000: PUSH1      0x01            3   [→1]
 * // 002: PUSH1      0x02            3   [→1]
 * // 004: ADD                        3   [2→1]
 * //
 * // Summary:
 * //   Total Gas: 9
 * //   Instructions: 3
 * //   Blocks: 1
 * ```
 */
export function prettyPrint(bytecode: import("./BytecodeType.js").BrandedBytecode, options?: import("./BytecodeType.js").PrettyPrintOptions): string;
//# sourceMappingURL=prettyPrint.d.ts.map