/**
 * @description Sets the balance of an account
 * @param {string} address - Account address
 * @param {string} balance - Hex-encoded balance
 * @returns {Object} JSON-RPC request for hardhat_setBalance
 */
export function hardhat_setBalance(address, balance) {
	return {
		method: "hardhat_setBalance",
		params: [address, balance],
	};
}
