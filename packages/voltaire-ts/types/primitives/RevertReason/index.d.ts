import type { ReturnDataType } from "../ReturnData/ReturnDataType.js";
import { from as _from } from "./from.js";
import { fromReturnData as _fromReturnData } from "./fromReturnData.js";
import type { RevertReasonType } from "./RevertReasonType.js";
import { toString as _toString } from "./toString.js";
export * from "./constants.js";
export type { CustomRevertReason, ErrorRevertReason, PanicRevertReason, RevertReasonType, UnknownRevertReason, } from "./RevertReasonType.js";
/**
 * Create RevertReason from various inputs
 */
export declare function from(value: ReturnDataType | string | Uint8Array): RevertReasonType;
/**
 * Decode RevertReason from ReturnData
 */
export declare function fromReturnData(returnData: ReturnDataType): RevertReasonType;
/**
 * Convert RevertReason to string representation
 */
export declare function toString(reason: RevertReasonType): string;
/**
 * Internal exports for advanced usage
 */
export { _from, _fromReturnData, _toString };
//# sourceMappingURL=index.d.ts.map