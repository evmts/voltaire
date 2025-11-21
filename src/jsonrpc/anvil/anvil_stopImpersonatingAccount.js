/**
 * @description Stops impersonating an account
 * @param {string} address - Address to stop impersonating
 * @returns {Object} JSON-RPC request for anvil_stopImpersonatingAccount
 */
export function anvil_stopImpersonatingAccount(address) {
	return {
		method: "anvil_stopImpersonatingAccount",
		params: [address],
	};
}
