import type { ConstructorType } from "../constructor/ConstructorType.js";
import type { ErrorType } from "../error/ErrorType.js";
import type { EventType } from "../event/EventType.js";
import type { FunctionType as Function } from "../function/FunctionType.js";
import type { Fallback, ItemType, Receive } from "./ItemType.js";

/**
 * Item constructor interface - provides type guards and utilities for ABI items
 */
export interface ItemConstructor {
	/**
	 * Type guard to check if an item is a Function
	 */
	isFunction(item: ItemType): item is Function;

	/**
	 * Type guard to check if an item is an Event
	 */
	isEvent(item: ItemType): item is EventType;

	/**
	 * Type guard to check if an item is an Error
	 */
	isError(item: ItemType): item is ErrorType;

	/**
	 * Type guard to check if an item is a Constructor
	 */
	isConstructor(item: ItemType): item is ConstructorType;

	/**
	 * Type guard to check if an item is a Fallback
	 */
	isFallback(item: ItemType): item is Fallback;

	/**
	 * Type guard to check if an item is a Receive
	 */
	isReceive(item: ItemType): item is Receive;

	/**
	 * Format an ABI item to a human-readable string
	 */
	format(item: ItemType): string;

	/**
	 * Format an ABI item with concrete argument values
	 */
	formatWithArgs(item: ItemType, args: readonly unknown[]): string;

	/**
	 * Get an item from an ABI by name and optionally by type
	 */
	getItem<
		TAbi extends readonly ItemType[],
		TName extends string,
		TType extends ItemType["type"] | undefined = undefined,
	>(
		abi: TAbi,
		name: TName,
		type?: TType,
	): Extract<TAbi[number], { name: TName }> | undefined;
}
