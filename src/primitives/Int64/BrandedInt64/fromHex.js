/**
 * Create Int64 from hex string (two's complement)
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./BrandedInt64.js').BrandedInt64} Int64 value
 * @throws {Error} If hex is invalid or exceeds 8 bytes
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;

	if (cleaned.length > 16) {
		throw new Error(
			`Int64 hex cannot exceed 16 characters (8 bytes), got ${cleaned.length}`,
		);
	}

	if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
		throw new Error(`Invalid hex string: ${hex}`);
	}

	if (cleaned.length === 0) {
		return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (0n);
	}

	// Parse as unsigned bigint
	const unsigned = BigInt(`0x${cleaned}`);

	// Convert to signed if necessary (check bit 63)
	if (cleaned.length === 16 && unsigned >= 1n << 63n) {
		// Negative value
		const signed = unsigned - (1n << 64n);
		return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (signed);
	}

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (unsigned);
}
