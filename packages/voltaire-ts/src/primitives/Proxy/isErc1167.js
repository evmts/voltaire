const CREATION_PREFIX = [
	0x3d, 0x60, 0x2d, 0x80, 0x60, 0x0a, 0x3d, 0x39, 0x81, 0xf3,
];
const RUNTIME_PREFIX = [
	0x36, 0x3d, 0x3d, 0x37, 0x3d, 0x3d, 0x3d, 0x36, 0x3d, 0x73,
];
const RUNTIME_SUFFIX = [
	0x5a, 0xf4, 0x3d, 0x82, 0x80, 0x3e, 0x90, 0x3d, 0x91, 0x60, 0x2b, 0x57, 0xfd,
	0x5b, 0xf3,
];

/**
 * Check whether bytecode matches expected bytes starting at offset
 * @param {Uint8Array} bytecode
 * @param {number} offset
 * @param {readonly number[]} expected
 * @returns {boolean}
 */
function matchesAt(bytecode, offset, expected) {
	for (let i = 0; i < expected.length; i++) {
		if (bytecode[offset + i] !== expected[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Check if bytecode is a valid ERC-1167 minimal proxy
 * @see https://eips.ethereum.org/EIPS/eip-1167
 * @param {Uint8Array} bytecode - Bytecode to check
 * @returns {boolean} True if valid ERC-1167 proxy
 */
export function isErc1167(bytecode) {
	if (bytecode.length === 55) {
		return (
			matchesAt(bytecode, 0, CREATION_PREFIX) &&
			matchesAt(bytecode, 10, RUNTIME_PREFIX) &&
			matchesAt(bytecode, 40, RUNTIME_SUFFIX)
		);
	}
	if (bytecode.length === 45) {
		return (
			matchesAt(bytecode, 0, RUNTIME_PREFIX) &&
			matchesAt(bytecode, 30, RUNTIME_SUFFIX)
		);
	}
	return false;
}
