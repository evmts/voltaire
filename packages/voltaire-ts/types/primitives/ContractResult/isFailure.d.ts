/**
 * Check if result is failure
 *
 * @param {import('./ContractResultType.js').ContractResultType} result - Contract result
 * @returns {result is import('./ContractResultType.js').FailureResult} True if failure
 *
 * @example
 * ```typescript
 * if (ContractResult.isFailure(result)) {
 *   console.log(result.revertReason);
 * }
 * ```
 */
export function isFailure(result: import("./ContractResultType.js").ContractResultType): result is import("./ContractResultType.js").FailureResult;
//# sourceMappingURL=isFailure.d.ts.map