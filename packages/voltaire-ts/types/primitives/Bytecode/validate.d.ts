/**
 * Validate bytecode structure
 *
 * Performs basic validation checks on bytecode:
 * - Checks for incomplete PUSH instructions
 * - Validates bytecode can be parsed without errors
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Bytecode to validate
 * @returns {boolean} true if bytecode is valid
 *
 * @example
 * ```typescript
 * const valid = new Uint8Array([0x60, 0x01]); // PUSH1 0x01
 * Bytecode.validate(valid); // true
 *
 * const invalid = new Uint8Array([0x60]); // PUSH1 with no data
 * Bytecode.validate(invalid); // false
 * ```
 */
export function validate(code: import("./BytecodeType.js").BrandedBytecode): boolean;
//# sourceMappingURL=validate.d.ts.map