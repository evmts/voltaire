// @ts-nocheck
export * from "./BrandedAbi.js";

// Re-export sub-namespaces
export * as Function from "../function/index.js";
export * as Event from "../event/index.js";
export * as Error from "../error/index.js";
export * as Constructor from "../constructor/index.js";

import { decode } from "./decode.js";
import { decodeData } from "./decodeData.js";
import { encode } from "./encode.js";
import { format } from "./format.js";
import { formatWithArgs } from "./formatWithArgs.js";
import { getItem } from "./getItem.js";
import { parseLogs } from "./parseLogs.js";

// Import sub-namespaces
import * as FunctionNs from "../function/index.js";
import * as EventNs from "../event/index.js";
import * as ErrorNs from "../error/index.js";
import * as ConstructorNs from "../constructor/index.js";

// Export individual functions
export {
	decode,
	decodeData,
	encode,
	format,
	formatWithArgs,
	getItem,
	parseLogs,
};

/**
 * @typedef {import('./BrandedAbi.js').BrandedAbi} BrandedAbi
 * @typedef {import('./BrandedAbi.js').Item} Item
 */

/**
 * BrandedAbi namespace - operations on ABI arrays
 *
 * Sub-namespaces for specific item types:
 * - BrandedAbi.Function - Function ABI operations
 * - BrandedAbi.Event - Event ABI operations
 * - BrandedAbi.Error - Error ABI operations
 * - BrandedAbi.Constructor - Constructor ABI operations
 *
 * @example
 * import { BrandedAbi } from '@tevm/primitives';
 *
 * const item = BrandedAbi.getItem(abi, 'transfer', 'function');
 * const formatted = BrandedAbi.format(item);
 *
 * // Use sub-namespaces
 * const selector = BrandedAbi.Function.getSelector(functionItem);
 * const encoded = BrandedAbi.Event.encodeTopics(eventItem, args);
 */
export const BrandedAbi = {
	format,
	formatWithArgs,
	getItem,
	encode,
	decode,
	decodeData,
	parseLogs,
	Function: FunctionNs,
	Event: EventNs,
	Error: ErrorNs,
	Constructor: ConstructorNs,
};
