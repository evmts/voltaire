/**
 * Check if result is successful
 *
 * @param {import('./ContractResultType.js').ContractResultType} result - Contract result
 * @returns {result is import('./ContractResultType.js').SuccessResult} True if success
 *
 * @example
 * ```typescript
 * if (ContractResult.isSuccess(result)) {
 *   console.log(result.data);
 * }
 * ```
 */
export function isSuccess(result: import("./ContractResultType.js").ContractResultType): result is import("./ContractResultType.js").SuccessResult;
//# sourceMappingURL=isSuccess.d.ts.map