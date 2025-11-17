import type { Fallback, Receive } from "./Item/index.js";
import type { ConstructorType as Constructor } from "./constructor/ConstructorType.js";
import type { ErrorType } from "./error/ErrorType.js";
import type { EventType } from "./event/EventType.js";
import type { FunctionType as Function } from "./function/FunctionType.js";

/**
 * AbiType - Array of ABI items
 *
 * Represents a complete contract ABI with functions, events, errors, constructor, fallback, and receive
 *
 * @template TItems - The specific ABI items in this ABI
 */
export type AbiType<TItems extends readonly Item[] = readonly Item[]> = TItems;

/**
 * Single ABI item (function, event, error, constructor, fallback, or receive)
 */
export type Item =
	| Function
	| EventType
	| ErrorType
	| Constructor
	| Fallback
	| Receive;
