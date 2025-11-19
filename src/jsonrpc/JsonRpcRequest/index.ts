// Export type definition
export type { JsonRpcRequestType } from "./JsonRpcRequestType.js";

// Import internal functions
import type { JsonRpcRequestType } from "./JsonRpcRequestType.js";
import { from } from "./from.js";
import { withParams as _withParams } from "./withParams.js";

// Export constructors
export { from };

// Export public wrapper functions
export function withParams<TParams>(
	request: JsonRpcRequestType,
): (params: TParams) => JsonRpcRequestType<TParams> {
	return _withParams(from(request));
}

// Export internal functions (tree-shakeable)
export { _withParams };

// Export as namespace (convenience)
export const JsonRpcRequest = {
	from,
	withParams,
};
