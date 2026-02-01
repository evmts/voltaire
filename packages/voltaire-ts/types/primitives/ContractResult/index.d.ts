import type { ReturnDataType } from "../ReturnData/ReturnDataType.js";
import type { RevertReasonType } from "../RevertReason/RevertReasonType.js";
import type { ContractResultType, FailureResult, SuccessResult } from "./ContractResultType.js";
import { failure as _failure } from "./failure.js";
import { from as _from } from "./from.js";
import { isFailure as _isFailure } from "./isFailure.js";
import { isSuccess as _isSuccess } from "./isSuccess.js";
import { success as _success } from "./success.js";
import { unwrap as _unwrap } from "./unwrap.js";
import { unwrapOr as _unwrapOr } from "./unwrapOr.js";
export type { ContractResultType, FailureResult, SuccessResult, } from "./ContractResultType.js";
export * from "./errors.js";
/**
 * Create ContractResult from return data and success flag
 */
export declare function from(isSuccess: boolean, data: ReturnDataType | string | Uint8Array): ContractResultType;
/**
 * Create successful ContractResult
 */
export declare function success(data: ReturnDataType): SuccessResult;
/**
 * Create failed ContractResult
 */
export declare function failure(revertReason: RevertReasonType): FailureResult;
/**
 * Check if result is successful (type guard)
 */
export declare function isSuccess(result: ContractResultType): result is SuccessResult;
/**
 * Check if result is failure (type guard)
 */
export declare function isFailure(result: ContractResultType): result is FailureResult;
/**
 * Unwrap successful result or throw on failure
 */
export declare function unwrap(result: ContractResultType): ReturnDataType;
/**
 * Unwrap result or return default value on failure
 */
export declare function unwrapOr(result: ContractResultType, defaultValue: ReturnDataType): ReturnDataType;
/**
 * Internal exports for advanced usage
 */
export { _from, _success, _failure, _isSuccess, _isFailure, _unwrap, _unwrapOr, };
//# sourceMappingURL=index.d.ts.map