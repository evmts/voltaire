/**
 * @description Starts impersonating an account
 * @param {string} address - Address to impersonate
 * @returns {Object} JSON-RPC request for hardhat_impersonateAccount
 */
export function hardhat_impersonateAccount(address) {
	return {
		method: "hardhat_impersonateAccount",
		params: [address],
	};
}
