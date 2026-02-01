/**
 * Extract bytecode without metadata
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Bytecode with metadata
 * @returns {import('./BytecodeType.js').BrandedBytecode} Bytecode without metadata
 *
 * @example
 * ```typescript
 * const withMeta = new Uint8Array([...bytecode, ...metadata]);
 * const without = Bytecode.stripMetadata(withMeta);
 * ```
 */
export function stripMetadata(code: import("./BytecodeType.js").BrandedBytecode): import("./BytecodeType.js").BrandedBytecode;
//# sourceMappingURL=stripMetadata.d.ts.map