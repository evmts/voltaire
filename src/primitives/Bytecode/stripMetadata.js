import { hasMetadata } from "./hasMetadata.js";

/**
 * Extract bytecode without metadata
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode with metadata
 * @returns {import('./BrandedBytecode.js').BrandedBytecode} Bytecode without metadata
 *
 * @example
 * ```typescript
 * const withMeta = new Uint8Array([...bytecode, ...metadata]);
 * const without = Bytecode.stripMetadata(withMeta);
 * ```
 */
export function stripMetadata(code) {
	if (!hasMetadata(code)) return code;

	// Last 2 bytes indicate metadata length
	const metadataLength = (code[code.length - 1] ?? 0) + 2;
	return code.slice(0, -metadataLength);
}
