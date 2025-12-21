// Export type definition
export type { JsonRpcRequestType } from "./JsonRpcRequestType.js";

// Import internal functions
import type { JsonRpcRequestType } from "./JsonRpcRequestType.js";
import { from } from "./from.js";
import { isNotification as _isNotification } from "./isNotification.js";
import { withParams as _withParams } from "./withParams.js";

// Export constructors
export { from };

// Export utilities
export function isNotification(request: JsonRpcRequestType): boolean {
	return _isNotification(request);
}

// Export public wrapper functions
export function withParams<TParams>(
	request: JsonRpcRequestType,
): (params: TParams) => JsonRpcRequestType<TParams> {
	return _withParams(from(request)) as (
		params: TParams,
	) => JsonRpcRequestType<TParams>;
}

// Export internal functions (tree-shakeable)
export { _withParams, _isNotification };

// Export as namespace (convenience)
export const JsonRpcRequest = {
	from,
	withParams,
	isNotification,
};
