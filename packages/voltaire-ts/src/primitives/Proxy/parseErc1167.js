/**
 * Parse implementation address from ERC-1167 minimal proxy bytecode
 * Extracts the 20-byte implementation address from the proxy bytecode
 * @see https://eips.ethereum.org/EIPS/eip-1167
 * @param {Uint8Array} bytecode - Proxy bytecode (45 or 55 bytes)
 * @returns {Uint8Array | null} 20-byte implementation address or null if invalid
 */
export function parseErc1167(bytecode) {
	// Can be either runtime code (45 bytes) or creation code (55 bytes)
	if (bytecode.length !== 45 && bytecode.length !== 55) {
		return null;
	}

	// Determine offset based on bytecode length
	// Creation code: implementation at offset 20
	// Runtime code: implementation at offset 10
	const offset = bytecode.length === 55 ? 20 : 10;

	// Verify prefix pattern
	if (bytecode.length === 55) {
		// Creation code prefix check
		if (
			bytecode[0] !== 0x3d ||
			bytecode[1] !== 0x60 ||
			bytecode[2] !== 0x2d ||
			bytecode[19] !== 0x73
		) {
			return null;
		}
	} else {
		// Runtime code prefix check
		if (
			bytecode[0] !== 0x36 ||
			bytecode[1] !== 0x3d ||
			bytecode[2] !== 0x3d ||
			bytecode[9] !== 0x73
		) {
			return null;
		}
	}

	// Extract implementation address (20 bytes)
	return bytecode.slice(offset, offset + 20);
}
