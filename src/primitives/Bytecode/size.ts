import type { BrandedBytecode } from "./BrandedBytecode.js";

/**
 * Get bytecode size in bytes
 *
 * @param code - Bytecode
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * Bytecode.size(code); // 2
 * ```
 */
export function size(code: BrandedBytecode): number {
	return code.length;
}
