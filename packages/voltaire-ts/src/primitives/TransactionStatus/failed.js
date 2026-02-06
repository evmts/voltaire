/**
 * Create failed status
 *
 * @param {string} [revertReason]
 * @returns {import('./TransactionStatusType.js').TransactionStatusType}
 */
export function failed(revertReason) {
	return { type: "failed", revertReason };
}
