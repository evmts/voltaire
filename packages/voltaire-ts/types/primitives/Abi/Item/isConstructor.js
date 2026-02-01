/**
 * Type guard to check if an item is a Constructor
 * @param {import('./ItemType.js').ItemType} item - The item to check
 * @returns {item is import('../constructor/ConstructorType.js').ConstructorType}
 */
export function isConstructor(item) {
    return item.type === "constructor";
}
