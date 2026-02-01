/**
 * Derived RPC Schema
 *
 * Utilities for composing and extending RPC schemas.
 *
 * @module provider/schemas/DerivedRpcSchema
 */
import type { RpcSchema } from "../RpcSchema.js";
/**
 * Schema override type
 */
export type RpcSchemaOverride = RpcSchema | undefined;
/**
 * Derive RPC schema from base and override
 *
 * Allows extending a base schema with additional methods or overriding existing ones.
 *
 * @template TBase - Base schema
 * @template TOverride - Override schema (optional)
 *
 * @example
 * ```typescript
 * type BaseSchema = readonly [
 *   { Method: 'eth_blockNumber', Parameters: [], ReturnType: string }
 * ];
 *
 * type CustomSchema = readonly [
 *   { Method: 'custom_method', Parameters: [string], ReturnType: number }
 * ];
 *
 * type Combined = DerivedRpcSchema<BaseSchema, CustomSchema>;
 * // Result: both eth_blockNumber and custom_method are available
 * ```
 */
export type DerivedRpcSchema<TBase extends RpcSchema | undefined, TOverride extends RpcSchemaOverride = undefined> = TOverride extends RpcSchema ? TOverride : TBase extends RpcSchema ? TBase : RpcSchema;
//# sourceMappingURL=DerivedRpcSchema.d.ts.map