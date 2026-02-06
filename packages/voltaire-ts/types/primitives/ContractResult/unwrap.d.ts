/**
 * Unwrap successful result or throw on failure
 *
 * @param {import('./ContractResultType.js').ContractResultType} result - Contract result
 * @returns {import('../ReturnData/ReturnDataType.js').ReturnDataType} Return data
 * @throws {ContractRevertError} If result is failure
 *
 * @example
 * ```typescript
 * try {
 *   const data = ContractResult.unwrap(result);
 * } catch (error) {
 *   console.log(error.revertReason);
 * }
 * ```
 */
export function unwrap(result: import("./ContractResultType.js").ContractResultType): import("../ReturnData/ReturnDataType.js").ReturnDataType;
//# sourceMappingURL=unwrap.d.ts.map