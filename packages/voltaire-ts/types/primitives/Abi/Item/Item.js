// @ts-nocheck
import { format } from "./format.js";
import { formatWithArgs } from "./formatWithArgs.js";
import { getItem } from "./getItem.js";
import { isConstructor } from "./isConstructor.js";
import { isError } from "./isError.js";
import { isEvent } from "./isEvent.js";
import { isFallback } from "./isFallback.js";
import { isFunction } from "./isFunction.js";
import { isReceive } from "./isReceive.js";
/**
 * Item namespace - provides type guards and utilities for ABI items
 * Since Item is a discriminated union, this is primarily a namespace for type guards
 * rather than a constructor
 */
// Static type guard methods
export { isFunction, isEvent, isError, isConstructor, isFallback, isReceive };
// Static utility methods
export { format, formatWithArgs, getItem };
/**
 * Item "class" - a namespace object for ABI item operations
 * @type {import('./ItemConstructor.js').ItemConstructor}
 */
export const Item = {
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
