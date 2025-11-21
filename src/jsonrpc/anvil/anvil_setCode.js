/**
 * @description Sets the code at an address
 * @param {string} address - Account address
 * @param {string} code - Hex-encoded bytecode
 * @returns {Object} JSON-RPC request for anvil_setCode
 */
export function anvil_setCode(address, code) {
	return {
		method: "anvil_setCode",
		params: [address, code],
	};
}
