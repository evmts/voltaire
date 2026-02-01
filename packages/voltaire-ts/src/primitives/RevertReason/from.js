import * as ReturnData from "../ReturnData/index.js";
import { fromReturnData } from "./fromReturnData.js";

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
export function from(value) {
	if (typeof value === "string" || value instanceof Uint8Array) {
		const returnData = ReturnData.from(value);
		return fromReturnData(returnData);
	}
	// Already ReturnData
	return fromReturnData(value);
}
