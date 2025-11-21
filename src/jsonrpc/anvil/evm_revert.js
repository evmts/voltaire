/**
 * @description Reverts the blockchain state to a previous snapshot
 * @param {string} snapshotId - The snapshot ID to revert to
 * @returns {Object} JSON-RPC request for evm_revert
 */
export function evm_revert(snapshotId) {
	return {
		method: "evm_revert",
		params: [snapshotId],
	};
}
