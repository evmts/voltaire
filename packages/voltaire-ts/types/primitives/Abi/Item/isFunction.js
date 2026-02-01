/**
 * Type guard to check if an item is a Function
 * @param {import('./ItemType.js').ItemType} item - The item to check
 * @returns {item is import('../function/FunctionType.js').FunctionType}
 */
export function isFunction(item) {
    return item.type === "function";
}
