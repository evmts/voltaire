// @ts-nocheck
import * as BrandedItem from "./BrandedItem/index.js";

/**
 * Item namespace - provides type guards and utilities for ABI items
 * Since Item is a discriminated union, this is primarily a namespace for type guards
 * rather than a constructor
 */

// Static type guard methods
export const isFunction = BrandedItem.isFunction;
export const isEvent = BrandedItem.isEvent;
export const isError = BrandedItem.isError;
export const isConstructor = BrandedItem.isConstructor;
export const isFallback = BrandedItem.isFallback;
export const isReceive = BrandedItem.isReceive;

// Static utility methods
export const format = BrandedItem.format;
export const formatWithArgs = BrandedItem.formatWithArgs;
export const getItem = BrandedItem.getItem;

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
