/**
 * Check if status is pending
 *
 * @param {import('./TransactionStatusType.js').TransactionStatusType} status
 * @returns {boolean}
 */
export function isPending(status) {
	return status.type === "pending";
}
