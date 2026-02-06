/**
 * Create pending status
 *
 * @returns {import('./TransactionStatusType.js').TransactionStatusType}
 */
export function pending() {
	return { type: "pending" };
}
