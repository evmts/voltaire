/**
 * Check if status is success
 *
 * @param {import('./TransactionStatusType.js').TransactionStatusType} status
 * @returns {status is { readonly type: "success"; readonly gasUsed: import('../Uint/Uint256Type.js').Uint256Type }}
 */
export function isSuccess(status) {
	return status.type === "success";
}
