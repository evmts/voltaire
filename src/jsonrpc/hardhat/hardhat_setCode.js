/**
 * @description Sets the code at an address
 * @param {string} address - Account address
 * @param {string} code - Hex-encoded bytecode
 * @returns {Object} JSON-RPC request for hardhat_setCode
 */
export function hardhat_setCode(address, code) {
	return {
		method: "hardhat_setCode",
		params: [address, code],
	};
}
