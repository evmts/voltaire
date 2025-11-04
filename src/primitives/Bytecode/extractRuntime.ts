import type { BrandedBytecode } from "./BrandedBytecode.js";

/**
 * Extract runtime bytecode from creation bytecode
 *
 * Creation bytecode typically contains constructor code followed by
 * runtime code. This extracts just the runtime portion.
 *
 * @param code - Creation bytecode
 * @param offset - Offset where runtime code starts
 * @returns Runtime bytecode
 *
 * @example
 * ```typescript
 * const creation = new Uint8Array([...constructor, ...runtime]);
 * const runtime = Bytecode.extractRuntime(creation, constructorLength);
 * ```
 */
export function extractRuntime(
	code: BrandedBytecode,
	offset: number,
): BrandedBytecode {
	return code.slice(offset) as BrandedBytecode;
}
