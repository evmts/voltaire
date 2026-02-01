/**
 * Detect fusion patterns in bytecode
 *
 * Scans bytecode for multi-instruction patterns that can be represented
 * as synthetic opcodes (0x100+). Returns array of detected fusions with
 * their type, position, and length.
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode - Bytecode to scan
 * @returns {Array<{type: string, pc: number, length: number}>} Detected fusion patterns
 *
 * @example
 * ```typescript
 * // PUSH1 0x05, ADD
 * const code = Bytecode.from(new Uint8Array([0x60, 0x05, 0x01]));
 * const fusions = Bytecode.detectFusions(code);
 * // [{type: 'push_add', pc: 0, length: 3}]
 * ```
 */
export function detectFusions(bytecode: import("./BytecodeType.js").BrandedBytecode): Array<{
    type: string;
    pc: number;
    length: number;
}>;
//# sourceMappingURL=detectFusions.d.ts.map