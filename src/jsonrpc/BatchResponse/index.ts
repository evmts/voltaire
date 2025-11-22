// Export type definition
export type { BatchResponseType } from "./BatchResponseType.js";

import type { JsonRpcIdType } from "../JsonRpcId/JsonRpcIdType.js";
// Import internal functions
import type { JsonRpcErrorResponseType } from "../JsonRpcResponse/JsonRpcResponseType.js";
import type { JsonRpcResponseType } from "../JsonRpcResponse/JsonRpcResponseType.js";
import type { BatchResponseType } from "./BatchResponseType.js";
import { errors as _errors } from "./errors.js";
import { findById as _findById } from "./findById.js";
import { from } from "./from.js";
import { results as _results } from "./results.js";

// Export constructors
export { from };

// Export public wrapper functions
export function findById(
	batch: BatchResponseType,
): (id: JsonRpcIdType) => JsonRpcResponseType | undefined {
	return _findById(batch);
}

export function errors(batch: BatchResponseType): JsonRpcErrorResponseType[] {
	return _errors(batch);
}

export function results(batch: BatchResponseType): JsonRpcResponseType[] {
	return _results(batch);
}

// Export internal functions (tree-shakeable)
export { _findById, _errors, _results };

// Export as namespace (convenience)
export const BatchResponse = {
	from,
	findById,
	errors,
	results,
};
