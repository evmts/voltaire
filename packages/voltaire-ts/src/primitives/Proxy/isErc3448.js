/**
 * Check if bytecode is valid ERC-3448 MetaProxy
 *
 * Validates:
 * - Minimum length (87 bytes: 55 proxy + 32 length)
 * - Creation code matches (10 bytes)
 * - Runtime code prefix matches (first 20 bytes)
 * - Runtime code suffix matches (last 15 bytes before metadata)
 * - Metadata length encoding is consistent
 *
 * @see https://eips.ethereum.org/EIPS/eip-3448
 * @param {Uint8Array} bytecode - Bytecode to validate
 * @returns {boolean} True if valid ERC-3448 MetaProxy
 */
export function isErc3448(bytecode) {
	// Minimum length: 55 (ERC-1167) + 32 (length encoding) = 87 bytes
	if (bytecode.length < 87) {
		return false;
	}

	// Read metadata length from last 32 bytes (big-endian uint256)
	let metadataLength = 0;
	for (let i = 0; i < 32; i++) {
		metadataLength =
			(metadataLength << 8) |
			/** @type {*} */ (bytecode[bytecode.length - 32 + i]);
	}

	// Validate total length matches expected size
	const expectedLength = 55 + metadataLength + 32;
	if (bytecode.length !== expectedLength) {
		return false;
	}

	// Validate ERC-1167 creation code prefix (10 bytes): 3d602d80600a3d3981f3
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
		return false;
	}

	// Validate runtime code prefix (10 bytes): 363d3d373d3d3d363d73
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
		return false;
	}

	// Validate runtime code suffix (15 bytes): 5af43d82803e903d91602b57fd5bf3
	return (
		bytecode[40] === 0x5a &&
		bytecode[41] === 0xf4 &&
		bytecode[42] === 0x3d &&
		bytecode[43] === 0x82 &&
		bytecode[44] === 0x80 &&
		bytecode[45] === 0x3e &&
		bytecode[46] === 0x90 &&
		bytecode[47] === 0x3d &&
		bytecode[48] === 0x91 &&
		bytecode[49] === 0x60 &&
		bytecode[50] === 0x2b &&
		bytecode[51] === 0x57 &&
		bytecode[52] === 0xfd &&
		bytecode[53] === 0x5b &&
		bytecode[54] === 0xf3
	);
}
