import { hasMetadata } from "./hasMetadata.js";
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
export function stripMetadata(code) {
    if (!hasMetadata(code))
        return code;
    // Last 2 bytes indicate metadata length
    const metadataLength = (code[code.length - 1] ?? 0) + 2;
    return /** @type {import('./BytecodeType.js').BrandedBytecode} */ (code.slice(0, -metadataLength));
}
