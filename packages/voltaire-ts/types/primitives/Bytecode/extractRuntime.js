/**
 * Extract runtime bytecode from creation bytecode
 *
 * Creation bytecode typically contains constructor code followed by
 * runtime code. This extracts just the runtime portion.
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} code - Creation bytecode
 * @param {number} offset - Offset where runtime code starts
 * @returns {import('./BytecodeType.js').BrandedBytecode} Runtime bytecode
 *
 * @example
 * ```typescript
 * const creation = new Uint8Array([...constructor, ...runtime]);
 * const runtime = Bytecode.extractRuntime(creation, constructorLength);
 * ```
 */
export function extractRuntime(code, offset) {
    return /** @type {import('./BytecodeType.js').BrandedBytecode} */ (code.slice(offset));
}
