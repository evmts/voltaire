/**
 * Legacy compatibility layer for JSON-RPC types
 * @deprecated Import from individual modules directly
 */

// Re-export all JSON-RPC envelope types as namespaces to avoid conflicts
export * as JsonRpcVersion from "./JsonRpcVersion/index.js";
export * as JsonRpcId from "./JsonRpcId/index.js";
export * as JsonRpcError from "./JsonRpcError/index.js";
export * as JsonRpcRequest from "./JsonRpcRequest/index.js";
export * as JsonRpcResponse from "./JsonRpcResponse/index.js";
export * as BatchRequest from "./BatchRequest/index.js";
export * as BatchResponse from "./BatchResponse/index.js";

// Export base primitive types
export {
	Quantity,
	Hash,
	BlockTag,
	BlockSpec,
	Data,
	Block,
} from "./base-types.js";

// Legacy helper
export { createRequest } from "./JsonRpcRequest.js";
