/**
 * Type guard to check if an item is an Error
 * @param {import('./BrandedItem.js').BrandedItem} item - The item to check
 * @returns {item is import('../../error/BrandedError.js').BrandedError}
 */
export function isError(item) {
	return item.type === "error";
}
