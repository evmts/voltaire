/**
 * Type guard to check if an item is an Event
 * @param {import('./ItemType.js').ItemType} item - The item to check
 * @returns {item is import('../event/EventType.js').EventType}
 */
export function isEvent(item) {
	return item.type === "event";
}
