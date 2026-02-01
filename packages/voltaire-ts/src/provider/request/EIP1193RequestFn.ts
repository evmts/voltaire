/**
 * EIP-1193 Request Function
 *
 * Type-safe request function type for JSON-RPC method calls.
 *
 * @module provider/request/EIP1193RequestFn
 */

import type {
	RpcMethodNames,
	RpcMethodReturnType,
	RpcSchema,
} from "../RpcSchema.js";
import type { EIP1193RequestOptions } from "./EIP1193RequestOptions.js";
import type { RequestArguments } from "./RequestArguments.js";

/**
 * Type-safe EIP-1193 request function
 *
 * @template TRpcSchema - RPC schema defining supported methods
 *
 * Generic request function that:
 * - Accepts method name and parameters
 * - Returns Promise with method-specific return type
 * - Supports optional request configuration
 *
 * @example
 * ```typescript
 * const request: EIP1193RequestFn<VoltaireRpcSchema> = async (args, options) => {
 *   // Implementation
 * };
 *
 * // Type-safe: return type inferred as string
 * const blockNumber = await request({
 *   method: 'eth_blockNumber'
 * });
 *
 * // Type-safe: params validated, return type inferred
 * const balance = await request({
 *   method: 'eth_getBalance',
 *   params: ['0x123...', 'latest']
 * });
 * ```
 */
export type EIP1193RequestFn<TRpcSchema extends RpcSchema> = <
	TMethod extends RpcMethodNames<TRpcSchema>,
>(
	args: RequestArguments<TRpcSchema, TMethod>,
	options?: EIP1193RequestOptions,
) => Promise<RpcMethodReturnType<TRpcSchema, TMethod>>;
