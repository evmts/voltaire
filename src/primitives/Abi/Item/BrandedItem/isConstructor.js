/**
 * Type guard to check if an item is a Constructor
 * @param {import('./BrandedItem.js').BrandedItem} item - The item to check
 * @returns {item is import('../../constructor/BrandedConstructor.js').BrandedConstructor}
 */
export function isConstructor(item) {
	return item.type === "constructor";
}
