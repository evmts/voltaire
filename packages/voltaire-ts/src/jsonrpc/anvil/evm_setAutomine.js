/**
 * @description Enables or disables automine
 * @param {boolean} enabled - True to enable automine, false to disable
 * @returns {Object} JSON-RPC request for evm_setAutomine
 */
export function evm_setAutomine(enabled) {
	return {
		method: "evm_setAutomine",
		params: [enabled],
	};
}
