/**
 * Calculate ERC-8042 (Diamond Storage) storage slot
 * Formula: keccak256(id)
 * Simpler than ERC-7201, just the direct hash of the identifier
 * @see https://eips.ethereum.org/EIPS/eip-8042
 * @param {Uint8Array} keccak256 - Keccak256 hash function
 * @param {string} id - Storage namespace identifier string
 * @returns {Uint8Array} 32-byte storage slot
 */
export function calculateErc8042(keccak256, id) {
	const encoder = new TextEncoder();
	const idBytes = encoder.encode(id);
	return keccak256(idBytes);
}
