/**
 * ABI (Application Binary Interface) Types and Utilities
 *
 * Complete ABI encoding/decoding with type safety for Ethereum smart contracts.
 * Supports functions, events, errors, constructors, and all ABI types.
 *
 * @example
 * ```typescript
 * import { Abi } from '@tevm/primitives';
 *
 * // Use namespace methods
 * const encoded = Abi.encodeFunction(...);
 * const decoded = Abi.decodeEvent(...);
 * ```
 */
export * as Constructor from "./constructor/index.js";
export { decode } from "./decode.js";
export { decodeData } from "./decodeData.js";
export * from "./decodeFunction.js";
export * from "./decodeLog.js";
export * from "./Encoding.js";
export * from "./Errors.js";
export { encode } from "./encode.js";
export * from "./encodeConstructor.js";
export * from "./encodeFunction.js";
export * from "./encodePacked.js";
export * as Error from "./error/index.js";
export * as Event from "./event/index.js";
export { format } from "./format.js";
export { formatWithArgs } from "./formatWithArgs.js";
export * as Function from "./function/index.js";
export * from "./getFunctionBySelector.js";
export { getItem } from "./getItem.js";
export * from "./getSelector.js";
export type { Fallback, Receive } from "./Item/index.js";
export * as Item from "./Item/index.js";
export type { Parameter as AbiParameter, ParametersToObject, ParametersToPrimitiveTypes, } from "./Parameter.js";
export * as Parameter from "./parameter/index.js";
export { parseLogs } from "./parseLogs.js";
export type { AbiType } from "./Type.js";
export * as Wasm from "./wasm/index.js";
import type { ConstructorType as Constructor } from "./constructor/index.js";
import type { ErrorType } from "./error/index.js";
import type { EventType } from "./event/EventType.js";
import type { FunctionType } from "./function/index.js";
import type { Fallback, Receive } from "./Item/index.js";
/**
 * ABI type: Array of ABI items (functions, events, errors, constructor, fallback, receive)
 */
export type Abi = ReadonlyArray<FunctionType | EventType | ErrorType | Constructor | Fallback | Receive>;
//# sourceMappingURL=AbiNamespace.d.ts.map