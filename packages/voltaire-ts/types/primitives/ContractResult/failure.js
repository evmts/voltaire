/**
 * Create failed ContractResult
 *
 * @param {import('../RevertReason/RevertReasonType.js').RevertReasonType} revertReason - Revert reason
 * @returns {import('./ContractResultType.js').FailureResult} Failure result
 *
 * @example
 * ```typescript
 * const result = ContractResult.failure(revertReason);
 * ```
 */
export function failure(revertReason) {
    return {
        success: false,
        revertReason,
    };
}
