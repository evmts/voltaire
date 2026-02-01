/**
 * @description Creates a snapshot of the current blockchain state
 * @returns {Object} JSON-RPC request for evm_snapshot
 */
export function evm_snapshot() {
	return {
		method: "evm_snapshot",
		params: [],
	};
}
