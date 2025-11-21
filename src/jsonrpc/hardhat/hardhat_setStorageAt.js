/**
 * @description Sets the storage value at a specific slot
 * @param {string} address - Contract address
 * @param {string} slot - Hex-encoded storage slot
 * @param {string} value - Hex-encoded storage value
 * @returns {Object} JSON-RPC request for hardhat_setStorageAt
 */
export function hardhat_setStorageAt(address, slot, value) {
	return {
		method: "hardhat_setStorageAt",
		params: [address, slot, value],
	};
}
