import type { BrandedBytecode } from "./BrandedBytecode.js";

/**
 * Check if bytecode contains CBOR metadata
 *
 * Solidity compiler includes CBOR-encoded metadata at the end of bytecode.
 *
 * @param code - Bytecode to check
 * @returns true if metadata is present
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([...bytecode, 0xa2, 0x64, ...metadata]);
 * Bytecode.hasMetadata(code); // true
 * ```
 */
export function hasMetadata(code: BrandedBytecode): boolean {
	// Solidity metadata starts with 0xa2 0x64 ('ipfs') or 0xa2 0x65 ('bzzr')
	// and ends with 0x00 0x33 (length 51) at the very end
	if (code.length < 2) return false;

	const lastTwo = code.slice(-2);
	const b0 = lastTwo[0] ?? 0;
	const b1 = lastTwo[1] ?? 0;
	// Check for common metadata length markers
	return b0 === 0x00 && b1 >= 0x20 && b1 <= 0x40;
}
