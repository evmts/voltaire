/**
 * Type guard to check if an item is a Fallback
 * @param {import('./BrandedItem.js').BrandedItem} item - The item to check
 * @returns {item is import('./BrandedItem.js').Fallback}
 */
export function isFallback(item) {
	return item.type === "fallback";
}
