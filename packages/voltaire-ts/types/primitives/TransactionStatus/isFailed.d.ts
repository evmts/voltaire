/**
 * Check if status is failed
 *
 * @param {import('./TransactionStatusType.js').TransactionStatusType} status
 * @returns {status is { readonly type: "failed"; readonly revertReason?: string }}
 */
export function isFailed(status: import("./TransactionStatusType.js").TransactionStatusType): status is {
    readonly type: "failed";
    readonly revertReason?: string;
};
//# sourceMappingURL=isFailed.d.ts.map