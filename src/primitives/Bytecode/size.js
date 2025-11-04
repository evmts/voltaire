/**
 * Get bytecode size in bytes
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode
 * @returns {number} Size in bytes
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * Bytecode.size(code); // 2
 * ```
 */
export function size(code) {
	return code.length;
}
