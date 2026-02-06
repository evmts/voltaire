/**
 * Check if status is failed
 *
 * @param {import('./TransactionStatusType.js').TransactionStatusType} status
 * @returns {status is { readonly type: "failed"; readonly revertReason?: string }}
 */
export function isFailed(status) {
    return status.type === "failed";
}
