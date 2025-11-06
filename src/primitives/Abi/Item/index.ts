// @ts-nocheck

// Re-export BrandedItem types
export type {
	BrandedItem,
	Fallback,
	Receive,
} from "./BrandedItem/BrandedItem.js";
export * from "./BrandedItem/index.js";

// Export Item class/namespace
export { Item } from "./Item.js";
export type { ItemConstructor } from "./ItemConstructor.js";

// Named exports for convenience
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
} from "./Item.js";
