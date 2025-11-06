import type { BrandedConstructor as Constructor } from "../constructor/BrandedConstructor.js";
import type { BrandedError } from "../error/BrandedError.js";
import type { Event } from "../event/BrandedEvent.js";
import type { Function } from "../function/BrandedFunction.js";
import type { Fallback, Receive } from "../Item/index.js";

/**
 * BrandedAbi - Array of ABI items
 *
 * Represents a complete contract ABI with functions, events, errors, constructor, fallback, and receive
 *
 * @template TItems - The specific ABI items in this ABI
 */
export type BrandedAbi<TItems extends readonly Item[] = readonly Item[]> =
	TItems;

/**
 * Single ABI item (function, event, error, constructor, fallback, or receive)
 */
export type Item =
	| Function
	| Event
	| BrandedError
	| Constructor
	| Fallback
	| Receive;
