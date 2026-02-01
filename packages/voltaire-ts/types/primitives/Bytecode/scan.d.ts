/**
 * Scan bytecode as a generator, yielding instruction metadata
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode - Bytecode to scan
 * @param {import('./BytecodeType.js').ScanOptions} [options] - Scan options
 * @returns {Generator<{
 *   pc: number;
 *   opcode: number;
 *   type: 'push' | 'regular';
 *   size: number;
 *   value?: bigint;
 *   gas?: number;
 *   stackEffect?: { pop: number; push: number };
 * }>} Generator yielding instruction metadata
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x6001600201");
 * for (const inst of Bytecode.scan(code)) {
 *   console.log(`PC ${inst.pc}: opcode ${inst.opcode}`);
 * }
 *
 * // With options
 * for (const inst of Bytecode.scan(code, { withGas: true, withStack: true })) {
 *   console.log(`PC ${inst.pc}: gas ${inst.gas}, stack ${inst.stackEffect}`);
 * }
 *
 * // With range
 * for (const inst of Bytecode.scan(code, { startPc: 2, endPc: 10 })) {
 *   console.log(`Instruction at ${inst.pc}`);
 * }
 * ```
 */
export function scan(bytecode: import("./BytecodeType.js").BrandedBytecode, options?: import("./BytecodeType.js").ScanOptions): Generator<{
    pc: number;
    opcode: number;
    type: "push" | "regular";
    size: number;
    value?: bigint;
    gas?: number;
    stackEffect?: {
        pop: number;
        push: number;
    };
}>;
//# sourceMappingURL=scan.d.ts.map