import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";

/**
 * Create Int64 from hex string (two's complement)
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidLengthError} If hex exceeds 8 bytes
 * @throws {InvalidFormatError} If hex is invalid
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;

	if (cleaned.length > 16) {
		throw new InvalidLengthError(
			`Int64 hex cannot exceed 16 characters (8 bytes), got ${cleaned.length}`,
			{
				value: hex,
				expected: "16 or fewer hex characters",
				docsPath: "/primitives/int64#from-hex",
			},
		);
	}

	if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
		throw new InvalidFormatError(`Invalid hex string: ${hex}`, {
			value: hex,
			expected: "valid hex characters",
			docsPath: "/primitives/int64#from-hex",
		});
	}

	if (cleaned.length === 0) {
		return /** @type {import('./Int64Type.js').BrandedInt64} */ (0n);
	}

	// Parse as unsigned bigint
	const unsigned = BigInt(`0x${cleaned}`);

	// Convert to signed if necessary (check bit 63)
	if (cleaned.length === 16 && unsigned >= 1n << 63n) {
		// Negative value
		const signed = unsigned - (1n << 64n);
		return /** @type {import('./Int64Type.js').BrandedInt64} */ (signed);
	}

	return /** @type {import('./Int64Type.js').BrandedInt64} */ (unsigned);
}
