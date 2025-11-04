import type { BrandedBytecode } from "./BrandedBytecode.js";
import { fromHex } from "./fromHex.js";

/**
 * Create Bytecode from various input types
 *
 * @param value - Hex string or Uint8Array
 * @returns Bytecode
 *
 * @example
 * ```typescript
 * const code1 = Bytecode.from("0x6001");
 * const code2 = Bytecode.from(new Uint8Array([0x60, 0x01]));
 * ```
 */
export function from(value: string | Uint8Array): BrandedBytecode {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return value as BrandedBytecode;
}
