/**
 * Type guard: Check if value is AccessListItem
 *
 * @param value - Value to check
 * @returns true if value is AccessListItem
 *
 * @example
 * ```typescript
 * if (AccessList.isItem(value)) {
 *   console.log(value.address, value.storageKeys);
 * }
 * ```
 */
export function isItem(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const item = value;
    return (item.address instanceof Uint8Array &&
        item.address.length === 20 &&
        Array.isArray(item.storageKeys) &&
        item.storageKeys.every((key) => key instanceof Uint8Array && key.length === 32));
}
