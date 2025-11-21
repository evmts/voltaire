/**
 * @description Starts impersonating an account
 * @param {string} address - Address to impersonate
 * @returns {Object} JSON-RPC request for anvil_impersonateAccount
 */
export function anvil_impersonateAccount(address) {
	return {
		method: "anvil_impersonateAccount",
		params: [address],
	};
}
