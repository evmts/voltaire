import * as ReturnData from "../ReturnData/index.js";
import * as RevertReason from "../RevertReason/index.js";
import { success } from "./success.js";
import { failure } from "./failure.js";

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
export function from(isSuccess, data) {
	const returnData =
		typeof data === "string" || data instanceof Uint8Array
			? ReturnData.from(data)
			: data;

	if (isSuccess) {
		return success(returnData);
	}

	const revertReason = RevertReason.fromReturnData(returnData);
	return failure(revertReason);
}
