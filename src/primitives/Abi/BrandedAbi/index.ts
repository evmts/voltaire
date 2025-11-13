// @ts-nocheck
export * from "./BrandedAbi.js";

// Re-export sub-namespaces
import { Function } from "../function/Function.js";
import { Event } from "../event/Event.js";
import { Error } from "../error/Error.js";
import * as ConstructorExport from "../constructor/index.js";
export { Function, Event, Error };
export { ConstructorExport as Constructor };

import * as ItemNs from "../Item/index.js";
import * as ConstructorNs from "../constructor/index.js";
import * as ErrorNs from "../error/index.js";
import * as EventNs from "../event/index.js";
import * as FunctionNs from "../function/index.js";
import { decode } from "./decode.js";
import { decodeData } from "./decodeData.js";
import { encode } from "./encode.js";
import { format } from "./format.js";
import { formatWithArgs } from "./formatWithArgs.js";
import { getItem } from "./getItem.js";
import { parseLogs } from "./parseLogs.js";

import * as ConstructorNs from "../constructor/index.js";
import * as ErrorNs from "../error/index.js";
import * as EventNs from "../event/index.js";
// Import sub-namespaces
import * as FunctionNs from "../function/index.js";

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
	Function: FunctionNs.Function,
	Event: EventNs.Event,
	Error: ErrorNs.Error,
	Constructor: ConstructorNs,
	Item: ItemNs,
};
