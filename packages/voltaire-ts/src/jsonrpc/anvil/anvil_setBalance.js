/**
 * @description Sets the balance of an account
 * @param {string} address - Account address
 * @param {string} balance - Hex-encoded balance
 * @returns {Object} JSON-RPC request for anvil_setBalance
 */
export function anvil_setBalance(address, balance) {
	return {
		method: "anvil_setBalance",
		params: [address, balance],
	};
}
