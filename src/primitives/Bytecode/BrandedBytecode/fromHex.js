import { InvalidFormatError } from "../../errors/ValidationError.js";

/**
 * Parse hex string to bytecode
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./BrandedBytecode.js').BrandedBytecode} Bytecode
 * @throws {InvalidFormatError} If hex string has odd length
 *
 * @example
 * ```typescript
 * const code = Bytecode.fromHex("0x6001");
 * // Uint8Array([0x60, 0x01])
 * ```
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (cleaned.length % 2 !== 0) {
		throw new InvalidFormatError("Invalid hex string: odd length", {
			value: hex,
			expected: "Even-length hex string",
			code: "BYTECODE_ODD_LENGTH",
			docsPath: "/primitives/bytecode/from-hex#error-handling",
		});
	}
	const bytes = new Uint8Array(cleaned.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
	}
	return /** @type {import('./BrandedBytecode.js').BrandedBytecode} */ (bytes);
}
