// @ts-nocheck
export * from "./BrandedItem.js";

import { format } from "./format.js";
import { formatWithArgs } from "./formatWithArgs.js";
import { getItem } from "./getItem.js";
import { isConstructor } from "./isConstructor.js";
import { isError } from "./isError.js";
import { isEvent } from "./isEvent.js";
import { isFallback } from "./isFallback.js";
import { isFunction } from "./isFunction.js";
import { isReceive } from "./isReceive.js";

// Export individual functions
export {
	isFunction,
	isEvent,
	isError,
	isConstructor,
	isFallback,
	isReceive,
	format,
	formatWithArgs,
	getItem,
};

// Namespace export
export const BrandedItem = {
	isFunction,
	isEvent,
	isError,
	isConstructor,
	isFallback,
	isReceive,
	format,
	formatWithArgs,
	getItem,
};
