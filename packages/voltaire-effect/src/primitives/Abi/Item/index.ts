import { Item } from "@tevm/voltaire/Abi";

export type { ItemType } from "@tevm/voltaire/Abi";

export const {
	format,
	formatWithArgs,
	getItem,
	isConstructor,
	isError,
	isEvent,
	isFallback,
	isFunction,
	isReceive,
} = Item;

export { Item };
