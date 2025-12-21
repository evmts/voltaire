// Export type definition
export type { BatchRequestType } from "./BatchRequestType.js";

// Import internal functions
import type { JsonRpcRequestType } from "../JsonRpcRequest/JsonRpcRequestType.js";
import type { BatchRequestType } from "./BatchRequestType.js";
import { add as _add } from "./add.js";
import { from } from "./from.js";
import { size as _size } from "./size.js";

// Export constructors
export { from };

// Export public wrapper functions
export function add(
	batch: BatchRequestType,
): (request: JsonRpcRequestType) => BatchRequestType {
	return _add(batch as unknown[]) as (request: JsonRpcRequestType) => BatchRequestType;
}

export function size(batch: BatchRequestType): number {
	return _size(batch as unknown[]);
}

// Export internal functions (tree-shakeable)
export { _add, _size };

// Export as namespace (convenience)
export const BatchRequest = {
	from,
	add,
	size,
};
