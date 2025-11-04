import type { BrandedBytecode } from "./BrandedBytecode.js";

/**
 * Parse hex string to bytecode
 *
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Bytecode
 *
 * @example
 * ```typescript
 * const code = Bytecode.fromHex("0x6001");
 * // Uint8Array([0x60, 0x01])
 * ```
 */
export function fromHex(hex: string): BrandedBytecode {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (cleaned.length % 2 !== 0) {
		throw new Error("Invalid hex string: odd length");
	}
	const bytes = new Uint8Array(cleaned.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as BrandedBytecode;
}
