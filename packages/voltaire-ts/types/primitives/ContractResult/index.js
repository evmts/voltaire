import { failure as _failure } from "./failure.js";
import { from as _from } from "./from.js";
import { isFailure as _isFailure } from "./isFailure.js";
import { isSuccess as _isSuccess } from "./isSuccess.js";
import { success as _success } from "./success.js";
import { unwrap as _unwrap } from "./unwrap.js";
import { unwrapOr as _unwrapOr } from "./unwrapOr.js";
export * from "./errors.js";
/**
 * Create ContractResult from return data and success flag
 */
export function from(isSuccess, data) {
    return _from(isSuccess, data);
}
/**
 * Create successful ContractResult
 */
export function success(data) {
    return _success(data);
}
/**
 * Create failed ContractResult
 */
export function failure(revertReason) {
    return _failure(revertReason);
}
/**
 * Check if result is successful (type guard)
 */
export function isSuccess(result) {
    return _isSuccess(result);
}
/**
 * Check if result is failure (type guard)
 */
export function isFailure(result) {
    return _isFailure(result);
}
/**
 * Unwrap successful result or throw on failure
 */
export function unwrap(result) {
    return _unwrap(result);
}
/**
 * Unwrap result or return default value on failure
 */
export function unwrapOr(result, defaultValue) {
    return _unwrapOr(result, defaultValue);
}
/**
 * Internal exports for advanced usage
 */
export { _from, _success, _failure, _isSuccess, _isFailure, _unwrap, _unwrapOr, };
