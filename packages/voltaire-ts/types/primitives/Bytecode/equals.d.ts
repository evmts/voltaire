/**
 * Compare two bytecode arrays for equality
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} a - First bytecode
 * @param {import('./BytecodeType.js').BrandedBytecode} b - Second bytecode
 * @returns {boolean} true if bytecode is identical
 *
 * @example
 * ```typescript
 * const code1 = new Uint8Array([0x60, 0x01]);
 * const code2 = new Uint8Array([0x60, 0x01]);
 * Bytecode.equals(code1, code2); // true
 * ```
 */
export function equals(a: import("./BytecodeType.js").BrandedBytecode, b: import("./BytecodeType.js").BrandedBytecode): boolean;
//# sourceMappingURL=equals.d.ts.map