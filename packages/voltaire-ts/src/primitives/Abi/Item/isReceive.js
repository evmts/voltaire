/**
 * Type guard to check if an item is a Receive
 * @param {import('./ItemType.js').ItemType} item - The item to check
 * @returns {item is import('./ItemType.js').Receive}
 */
export function isReceive(item) {
	return item.type === "receive";
}
