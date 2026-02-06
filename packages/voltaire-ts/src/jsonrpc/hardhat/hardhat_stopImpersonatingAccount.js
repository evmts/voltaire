/**
 * @description Stops impersonating an account
 * @param {string} address - Address to stop impersonating
 * @returns {Object} JSON-RPC request for hardhat_stopImpersonatingAccount
 */
export function hardhat_stopImpersonatingAccount(address) {
	return {
		method: "hardhat_stopImpersonatingAccount",
		params: [address],
	};
}
