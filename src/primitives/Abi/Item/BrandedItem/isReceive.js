/**
 * Type guard to check if an item is a Receive
 * @param {import('./BrandedItem.js').BrandedItem} item - The item to check
 * @returns {item is import('./BrandedItem.js').Receive}
 */
export function isReceive(item) {
	return item.type === "receive";
}
