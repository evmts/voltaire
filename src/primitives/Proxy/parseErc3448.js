/**
 * Parse ERC-3448 MetaProxy bytecode
 *
 * Extracts implementation address and metadata from ERC-3448 MetaProxy bytecode.
 * Reads last 32 bytes as metadata length, then extracts:
 * - Implementation address from bytes 20-39 (within creation code)
 * - Metadata from bytes 55 to (length - 32)
 *
 * @see https://eips.ethereum.org/EIPS/eip-3448
 * @param {Uint8Array} bytecode - MetaProxy bytecode
 * @returns {{ implementation: Uint8Array, metadata: Uint8Array } | null} Parsed components or null if invalid
 */
export function parseErc3448(bytecode) {
	// Minimum length: 55 (ERC-1167) + 32 (length encoding) = 87 bytes
	if (bytecode.length < 87) {
		return null;
	}

	// Read metadata length from last 32 bytes (big-endian uint256)
	let metadataLength = 0;
	for (let i = 0; i < 32; i++) {
		metadataLength = (metadataLength << 8) | bytecode[bytecode.length - 32 + i];
	}

	// Validate total length matches expected size
	const expectedLength = 55 + metadataLength + 32;
	if (bytecode.length !== expectedLength) {
		return null;
	}

	// Verify ERC-1167 creation code prefix (first 10 bytes)
	if (
		bytecode[0] !== 0x3d ||
		bytecode[1] !== 0x60 ||
		bytecode[2] !== 0x2d ||
		bytecode[3] !== 0x80 ||
		bytecode[4] !== 0x60 ||
		bytecode[5] !== 0x0a ||
		bytecode[6] !== 0x3d ||
		bytecode[7] !== 0x39 ||
		bytecode[8] !== 0x81 ||
		bytecode[9] !== 0xf3
	) {
		return null;
	}

	// Verify runtime code prefix within creation code
	if (
		bytecode[10] !== 0x36 ||
		bytecode[11] !== 0x3d ||
		bytecode[12] !== 0x3d ||
		bytecode[13] !== 0x37 ||
		bytecode[14] !== 0x3d ||
		bytecode[15] !== 0x3d ||
		bytecode[16] !== 0x3d ||
		bytecode[17] !== 0x36 ||
		bytecode[18] !== 0x3d ||
		bytecode[19] !== 0x73
	) {
		return null;
	}

	// Verify runtime code suffix (before metadata)
	if (
		bytecode[40] !== 0x5a ||
		bytecode[41] !== 0xf4 ||
		bytecode[42] !== 0x3d ||
		bytecode[43] !== 0x82 ||
		bytecode[44] !== 0x80 ||
		bytecode[45] !== 0x3e ||
		bytecode[46] !== 0x90 ||
		bytecode[47] !== 0x3d ||
		bytecode[48] !== 0x91 ||
		bytecode[49] !== 0x60 ||
		bytecode[50] !== 0x2b ||
		bytecode[51] !== 0x57 ||
		bytecode[52] !== 0xfd ||
		bytecode[53] !== 0x5b ||
		bytecode[54] !== 0xf3
	) {
		return null;
	}

	// Extract implementation address (bytes 20-39)
	const implementation = bytecode.slice(20, 40);

	// Extract metadata (bytes 55 to length - 32)
	const metadata = bytecode.slice(55, 55 + metadataLength);

	return {
		implementation,
		metadata,
	};
}
