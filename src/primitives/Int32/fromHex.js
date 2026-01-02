import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";

/**
 * Create Int32 from hex string (two's complement)
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {InvalidLengthError} If hex exceeds 4 bytes
 * @throws {InvalidFormatError} If hex is invalid
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;

	if (cleaned.length > 8) {
		throw new InvalidLengthError(
			`Int32 hex cannot exceed 8 characters (4 bytes), got ${cleaned.length}`,
			{
				value: hex,
				expected: "8 or fewer hex characters",
				docsPath: "/primitives/int32#from-hex",
			},
		);
	}

	if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
		throw new InvalidFormatError(`Invalid hex string: ${hex}`, {
			value: hex,
			expected: "valid hex characters",
			docsPath: "/primitives/int32#from-hex",
		});
	}

	if (cleaned.length === 0) {
		return /** @type {import('./Int32Type.js').BrandedInt32} */ (0);
	}

	// Parse as unsigned 32-bit
	const unsigned = Number.parseInt(cleaned, 16);

	// Convert to signed using JavaScript's bitwise OR
	const signed = unsigned | 0;

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (signed);
}
