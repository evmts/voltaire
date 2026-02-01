/**
 * RPC Schema Type System
 *
 * Type-safe RPC schema for defining JSON-RPC methods, parameters, and return types.
 * Enables compile-time validation of method calls and return values.
 *
 * @module provider/RpcSchema
 */
/**
 * Base RPC schema type
 *
 * Readonly array of method definitions. Each entry maps:
 * - Method: JSON-RPC method name
 * - Parameters: Input parameter types (optional)
 * - ReturnType: Expected return type
 *
 * @example
 * ```typescript
 * const MySchema = [
 *   {
 *     Method: 'eth_blockNumber',
 *     Parameters: [],
 *     ReturnType: string
 *   },
 *   {
 *     Method: 'eth_call',
 *     Parameters: [{ to: string, data: string }, string],
 *     ReturnType: string
 *   }
 * ] as const satisfies RpcSchema;
 * ```
 */
export type RpcSchema = readonly {
    Method: string;
    Parameters?: unknown;
    ReturnType: unknown;
}[];
/**
 * Extract method names from schema
 *
 * @example
 * ```typescript
 * type Methods = RpcMethodNames<VoltaireRpcSchema>;
 * // => 'eth_blockNumber' | 'eth_call' | 'debug_traceTransaction' | ...
 * ```
 */
export type RpcMethodNames<TSchema extends RpcSchema> = TSchema[number]["Method"];
/**
 * Extract parameters for specific method
 *
 * @example
 * ```typescript
 * type CallParams = RpcMethodParameters<VoltaireRpcSchema, 'eth_call'>;
 * // => [{ to: string, data: string, ... }, string]
 * ```
 */
export type RpcMethodParameters<TSchema extends RpcSchema, TMethod extends RpcMethodNames<TSchema>> = Extract<TSchema[number], {
    Method: TMethod;
}>["Parameters"];
/**
 * Extract return type for specific method
 *
 * @example
 * ```typescript
 * type CallReturn = RpcMethodReturnType<VoltaireRpcSchema, 'eth_call'>;
 * // => string (hex-encoded bytes)
 * ```
 */
export type RpcMethodReturnType<TSchema extends RpcSchema, TMethod extends RpcMethodNames<TSchema>> = Extract<TSchema[number], {
    Method: TMethod;
}>["ReturnType"];
//# sourceMappingURL=RpcSchema.d.ts.map