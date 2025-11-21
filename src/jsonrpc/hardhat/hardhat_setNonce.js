/**
 * @description Sets the nonce of an account
 * @param {string} address - Account address
 * @param {string} nonce - Hex-encoded nonce
 * @returns {Object} JSON-RPC request for hardhat_setNonce
 */
export function hardhat_setNonce(address, nonce) {
	return {
		method: "hardhat_setNonce",
		params: [address, nonce],
	};
}
