import type { ReturnDataType } from "../ReturnData/ReturnDataType.js";
import type { RevertReasonType } from "./RevertReasonType.js";
import { from as _from } from "./from.js";
import { fromReturnData as _fromReturnData } from "./fromReturnData.js";
import { toString as _toString } from "./toString.js";

export type {
	RevertReasonType,
	ErrorRevertReason,
	PanicRevertReason,
	CustomRevertReason,
	UnknownRevertReason,
} from "./RevertReasonType.js";

export * from "./constants.js";

/**
 * Create RevertReason from various inputs
 */
export function from(
	value: ReturnDataType | string | Uint8Array,
): RevertReasonType {
	return _from(value);
}

/**
 * Decode RevertReason from ReturnData
 */
export function fromReturnData(returnData: ReturnDataType): RevertReasonType {
	return _fromReturnData(returnData);
}

/**
 * Convert RevertReason to string representation
 */
export function toString(reason: RevertReasonType): string {
	return _toString(reason);
}

/**
 * Internal exports for advanced usage
 */
export { _from, _fromReturnData, _toString };
