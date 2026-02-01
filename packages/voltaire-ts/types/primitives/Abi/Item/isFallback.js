/**
 * Type guard to check if an item is a Fallback
 * @param {import('./ItemType.js').ItemType} item - The item to check
 * @returns {item is import('./ItemType.js').Fallback}
 */
export function isFallback(item) {
    return item.type === "fallback";
}
