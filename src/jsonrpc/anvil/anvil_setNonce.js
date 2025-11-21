/**
 * @description Sets the nonce of an account
 * @param {string} address - Account address
 * @param {string} nonce - Hex-encoded nonce
 * @returns {Object} JSON-RPC request for anvil_setNonce
 */
export function anvil_setNonce(address, nonce) {
	return {
		method: "anvil_setNonce",
		params: [address, nonce],
	};
}
