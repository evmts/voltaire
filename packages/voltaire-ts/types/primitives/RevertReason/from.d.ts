/**
 * Create RevertReason from various inputs
 *
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType | string | Uint8Array} value - Return data
 * @returns {import('./RevertReasonType.js').RevertReasonType} Decoded revert reason
 *
 * @example
 * ```typescript
 * const reason = RevertReason.from("0x08c379a0...");
 * ```
 */
export function from(value: import("../ReturnData/ReturnDataType.js").ReturnDataType | string | Uint8Array): import("./RevertReasonType.js").RevertReasonType;
//# sourceMappingURL=from.d.ts.map