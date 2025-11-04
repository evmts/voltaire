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

// Re-export sub-namespaces
export * as Item from "./Item.js";
export * as Function from "./function/index.js";
export * as Event from "./event/index.js";
export * as Error from "./error/index.js";
export * as Constructor from "./constructor/index.js";
export * as Wasm from "./wasm/index.js";

import type { Fallback, Receive } from "./Item.js";
import type { Constructor } from "./constructor/index.js";
import type { Error } from "./error/index.js";
import type { Event } from "./event/index.js";
// Main Abi type (array of ABI items)
import type { Function } from "./function/index.js";

/**
 * ABI type: Array of ABI items (functions, events, errors, constructor, fallback, receive)
 */
export type Abi = ReadonlyArray<
	Function | Event | Error | Constructor | Fallback | Receive
>;
