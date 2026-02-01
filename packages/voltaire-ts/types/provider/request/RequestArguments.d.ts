/**
 * EIP-1193 Request Arguments
 *
 * Type-safe request arguments for JSON-RPC method calls.
 *
 * @module provider/request/RequestArguments
 */
import type { RpcMethodNames, RpcMethodParameters, RpcSchema } from "../RpcSchema.js";
/**
 * EIP-1193 request arguments
 *
 * @template TRpcSchema - RPC schema
 * @template TMethod - Specific method name
 *
 * @example
 * ```typescript
 * const args: RequestArguments<VoltaireRpcSchema, 'eth_call'> = {
 *   method: 'eth_call',
 *   params: [{ to: '0x...', data: '0x...' }, 'latest']
 * };
 * ```
 */
export interface RequestArguments<TRpcSchema extends RpcSchema, TMethod extends RpcMethodNames<TRpcSchema> = RpcMethodNames<TRpcSchema>> {
    readonly method: TMethod;
    readonly params?: RpcMethodParameters<TRpcSchema, TMethod>;
}
//# sourceMappingURL=RequestArguments.d.ts.map