/**
 * Decode RevertReason from ReturnData
 *
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType} returnData - Return data from failed call
 * @returns {import('./RevertReasonType.js').RevertReasonType} Decoded revert reason
 *
 * @example
 * ```typescript
 * const returnData = ReturnData.fromHex("0x08c379a0...");
 * const reason = RevertReason.fromReturnData(returnData);
 * if (reason.type === "Error") {
 *   console.log(reason.message);
 * }
 * ```
 */
export function fromReturnData(returnData: import("../ReturnData/ReturnDataType.js").ReturnDataType): import("./RevertReasonType.js").RevertReasonType;
//# sourceMappingURL=fromReturnData.d.ts.map