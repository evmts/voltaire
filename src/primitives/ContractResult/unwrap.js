import { ContractRevertError } from "./errors.js";
import * as RevertReason from "../RevertReason/index.js";

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
export function unwrap(result) {
	if (result.success) {
		return result.data;
	}
	throw new ContractRevertError(
		RevertReason.toString(result.revertReason),
		result.revertReason,
	);
}
