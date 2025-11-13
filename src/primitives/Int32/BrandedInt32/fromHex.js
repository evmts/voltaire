/**
 * Create Int32 from hex string (two's complement)
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./BrandedInt32.js').BrandedInt32} Int32 value
 * @throws {Error} If hex is invalid or exceeds 4 bytes
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;

	if (cleaned.length > 8) {
		throw new Error(
			`Int32 hex cannot exceed 8 characters (4 bytes), got ${cleaned.length}`,
		);
	}

	if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
		throw new Error(`Invalid hex string: ${hex}`);
	}

	if (cleaned.length === 0) {
		return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (0);
	}

	// Parse as unsigned 32-bit
	const unsigned = Number.parseInt(cleaned, 16);

	// Convert to signed using JavaScript's bitwise OR
	const signed = unsigned | 0;

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (signed);
}
