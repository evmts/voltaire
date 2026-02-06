/**
 * Create ContractResult from return data and success flag
 *
 * @param {boolean} isSuccess - Whether call succeeded
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType | string | Uint8Array} data - Return data
 * @returns {import('./ContractResultType.js').ContractResultType} Contract result
 *
 * @example
 * ```typescript
 * const result = ContractResult.from(true, "0x0000...");
 * const failResult = ContractResult.from(false, "0x08c379a0...");
 * ```
 */
export function from(isSuccess: boolean, data: import("../ReturnData/ReturnDataType.js").ReturnDataType | string | Uint8Array): import("./ContractResultType.js").ContractResultType;
//# sourceMappingURL=from.d.ts.map