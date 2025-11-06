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

// Re-export all types
export type { AbiType } from "./Type.js";
export type {
	Parameter,
	ParametersToPrimitiveTypes,
	ParametersToObject,
} from "./Parameter.js";
export type { Fallback, Receive } from "./Item.js";

// Re-export all implementations
export * from "./Errors.js";
export * from "./Encoding.js";

// High-level ABI functions
export * from "./encodeFunction.js";
export * from "./decodeFunction.js";
export * from "./encodeConstructor.js";
export * from "./encodePacked.js";
export * from "./decodeLog.js";
export * from "./getSelector.js";
export * from "./getFunctionBySelector.js";

// Branded ABI methods (with this: parameter)
export { encode, decode, decodeData, parseLogs } from "./BrandedAbi/index.js";

// Re-export sub-namespaces
export * as Item from "./Item.js";
export * as Parameter from "./parameter/index.js";
export * as Function from "./function/index.js";
export * as Event from "./event/index.js";
export * as Error from "./error/index.js";
export * as Constructor from "./constructor/index.js";
export * as Wasm from "./wasm/index.js";
export * as BrandedAbi from "./BrandedAbi/index.js";

import type { Fallback, Receive } from "./Item.js";
import type { BrandedConstructor as Constructor } from "./constructor/index.js";
import type { BrandedError } from "./error/index.js";
import type { Event } from "./event/index.js";
// Main Abi type (array of ABI items)
import type { Function } from "./function/index.js";

/**
 * ABI type: Array of ABI items (functions, events, errors, constructor, fallback, receive)
 */
export type Abi = ReadonlyArray<
	Function | Event | BrandedError | Constructor | Fallback | Receive
>;
