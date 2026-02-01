/**
 * Type guard to check if an item is an Error
 * @param {import('./ItemType.js').ItemType} item - The item to check
 * @returns {item is import('../error/ErrorType.js').ErrorType}
 */
export function isError(item: import("./ItemType.js").ItemType): item is import("../error/ErrorType.js").ErrorType;
//# sourceMappingURL=isError.d.ts.map