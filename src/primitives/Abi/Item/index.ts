// @ts-nocheck

// Re-export ItemType types
export type { ItemType, Fallback, Receive } from "./ItemType.js";

// Internal method exports
export { format as _format } from "./format.js";
export { formatWithArgs as _formatWithArgs } from "./formatWithArgs.js";
export { getItem as _getItem } from "./getItem.js";
export { isConstructor as _isConstructor } from "./isConstructor.js";
export { isError as _isError } from "./isError.js";
export { isEvent as _isEvent } from "./isEvent.js";
export { isFallback as _isFallback } from "./isFallback.js";
export { isFunction as _isFunction } from "./isFunction.js";
export { isReceive as _isReceive } from "./isReceive.js";

// Public wrapper exports (no wrappers needed, direct re-exports)
export { format } from "./format.js";
export { formatWithArgs } from "./formatWithArgs.js";
export { getItem } from "./getItem.js";
export { isConstructor } from "./isConstructor.js";
export { isError } from "./isError.js";
export { isEvent } from "./isEvent.js";
export { isFallback } from "./isFallback.js";
export { isFunction } from "./isFunction.js";
export { isReceive } from "./isReceive.js";

// Export Item class/namespace
export { Item } from "./Item.js";
export type { ItemConstructor } from "./ItemConstructor.js";

// Legacy export for backwards compatibility (will be deprecated)
export type { ItemType as BrandedItem } from "./ItemType.js";
