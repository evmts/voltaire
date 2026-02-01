/**
 * Create success status
 *
 * @param {import('../Uint/Uint256Type.js').Uint256Type} gasUsed
 * @returns {import('./TransactionStatusType.js').TransactionStatusType}
 */
export function success(gasUsed) {
	return { type: "success", gasUsed };
}
