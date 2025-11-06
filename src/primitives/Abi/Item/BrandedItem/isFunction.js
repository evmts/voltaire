/**
 * Type guard to check if an item is a Function
 * @param {import('./BrandedItem.js').BrandedItem} item - The item to check
 * @returns {item is import('../../function/BrandedFunction.js').Function}
 */
export function isFunction(item) {
	return item.type === "function";
}
