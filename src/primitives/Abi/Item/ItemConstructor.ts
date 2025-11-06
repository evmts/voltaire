import type { BrandedItem } from "./BrandedItem/BrandedItem.js";
import type { BrandedConstructor } from "../constructor/BrandedConstructor/BrandedConstructor.js";
import type { BrandedError } from "../error/BrandedError/BrandedError.js";
import type { Event } from "../event/BrandedEvent/BrandedEvent.js";
import type { Function } from "../function/BrandedFunction/BrandedFunction.js";
import type { Fallback, Receive } from "./BrandedItem/BrandedItem.js";

/**
 * Item constructor interface - provides type guards and utilities for ABI items
 */
export interface ItemConstructor {
	/**
	 * Type guard to check if an item is a Function
	 */
	isFunction(item: BrandedItem): item is Function;

	/**
	 * Type guard to check if an item is an Event
	 */
	isEvent(item: BrandedItem): item is Event;

	/**
	 * Type guard to check if an item is an Error
	 */
	isError(item: BrandedItem): item is BrandedError;

	/**
	 * Type guard to check if an item is a Constructor
	 */
	isConstructor(item: BrandedItem): item is BrandedConstructor;

	/**
	 * Type guard to check if an item is a Fallback
	 */
	isFallback(item: BrandedItem): item is Fallback;

	/**
	 * Type guard to check if an item is a Receive
	 */
	isReceive(item: BrandedItem): item is Receive;

	/**
	 * Format an ABI item to a human-readable string
	 */
	format(item: BrandedItem): string;

	/**
	 * Format an ABI item with concrete argument values
	 */
	formatWithArgs(item: BrandedItem, args: readonly unknown[]): string;

	/**
	 * Get an item from an ABI by name and optionally by type
	 */
	getItem<
		TAbi extends readonly BrandedItem[],
		TName extends string,
		TType extends BrandedItem["type"] | undefined = undefined,
	>(
		abi: TAbi,
		name: TName,
		type?: TType,
	): Extract<TAbi[number], { name: TName }> | undefined;
}
