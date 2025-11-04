import { fromHex } from "./fromHex.js";

/**
 * Create Bytecode from various input types
 *
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./BrandedBytecode.js').BrandedBytecode} Bytecode
 *
 * @example
 * ```typescript
 * const code1 = Bytecode.from("0x6001");
 * const code2 = Bytecode.from(new Uint8Array([0x60, 0x01]));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return value;
}
