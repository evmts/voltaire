import type { BrandedBytecode } from "./BrandedBytecode.js";

/**
 * Format bytecode as hex string
 *
 * @param code - Bytecode to format
 * @param prefix - Whether to include 0x prefix
 * @returns Hex string
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * Bytecode.toHex(code); // "0x6001"
 * Bytecode.toHex(code, false); // "6001"
 * ```
 */
export function toHex(code: BrandedBytecode, prefix = true): string {
	const hex = Array.from(code)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return prefix ? `0x${hex}` : hex;
}
