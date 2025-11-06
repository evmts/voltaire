/**
 * Get an item from an ABI by name and optionally by type
 * @template {readonly import('./BrandedItem.js').BrandedItem[]} TAbi
 * @template {string} TName
 * @template {import('./BrandedItem.js').BrandedItem["type"] | undefined} TType
 * @param {TAbi} abi - The ABI array
 * @param {TName} name - The item name
 * @param {TType} [type] - Optional type filter
 * @returns {any}
 */
export function getItem(abi, name, type) {
	return abi.find(
		(item) =>
			"name" in item &&
			item.name === name &&
			(type === undefined || item.type === type),
	);
}
