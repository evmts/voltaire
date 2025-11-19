// Export type definitions
export type {
	JsonRpcResponseType,
	JsonRpcSuccessResponseType,
	JsonRpcErrorResponseType,
} from "./JsonRpcResponseType.js";

// Import internal functions
import type {
	JsonRpcErrorResponseType,
	JsonRpcResponseType,
	JsonRpcSuccessResponseType,
} from "./JsonRpcResponseType.js";
import type { JsonRpcErrorType } from "../JsonRpcError/JsonRpcErrorType.js";
import type { JsonRpcIdType } from "../JsonRpcId/JsonRpcIdType.js";
import { error as _error } from "./error.js";
import { from } from "./from.js";
import { isError as _isError } from "./isError.js";
import { isSuccess as _isSuccess } from "./isSuccess.js";
import { success as _success } from "./success.js";
import { unwrap as _unwrap } from "./unwrap.js";

// Export constructors
export { from };

// Export public wrapper functions
export function success<TResult>(
	id: JsonRpcIdType,
	result: TResult,
): JsonRpcSuccessResponseType<TResult> {
	return _success(id, result);
}

export function error(
	id: JsonRpcIdType,
	errorObj: JsonRpcErrorType,
): JsonRpcErrorResponseType {
	return _error(id, errorObj);
}

export function isSuccess<TResult>(
	response: JsonRpcResponseType<TResult>,
): response is JsonRpcSuccessResponseType<TResult> {
	return _isSuccess(response);
}

export function isError<TResult>(
	response: JsonRpcResponseType<TResult>,
): response is JsonRpcErrorResponseType {
	return _isError(response);
}

export function unwrap<TResult>(
	response: JsonRpcResponseType<TResult>,
): TResult {
	return _unwrap(response) as TResult;
}

// Export internal functions (tree-shakeable)
export { _success, _error, _isSuccess, _isError, _unwrap };

// Export as namespace (convenience)
export const JsonRpcResponse = {
	from,
	success,
	error,
	isSuccess,
	isError,
	unwrap,
};
