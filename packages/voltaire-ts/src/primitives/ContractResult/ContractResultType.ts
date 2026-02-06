import type { ReturnDataType } from "../ReturnData/ReturnDataType.js";
import type { RevertReasonType } from "../RevertReason/RevertReasonType.js";

/**
 * ContractResult - Result of contract call (success or failure)
 *
 * Union type representing the outcome of a contract call:
 * - Success: Call succeeded with return data
 * - Failure: Call reverted with revert reason
 */

/**
 * Successful contract call
 */
export type SuccessResult = {
	readonly success: true;
	readonly data: ReturnDataType;
};

/**
 * Failed contract call
 */
export type FailureResult = {
	readonly success: false;
	readonly revertReason: RevertReasonType;
};

/**
 * ContractResult union type
 */
export type ContractResultType = SuccessResult | FailureResult;
