/**
 * @description Sets the storage value at a specific slot
 * @param {string} address - Contract address
 * @param {string} slot - Hex-encoded storage slot
 * @param {string} value - Hex-encoded storage value
 * @returns {Object} JSON-RPC request for anvil_setStorageAt
 */
export function anvil_setStorageAt(address, slot, value) {
	return {
		method: "anvil_setStorageAt",
		params: [address, slot, value],
	};
}
