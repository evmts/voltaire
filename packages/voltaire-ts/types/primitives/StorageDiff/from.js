/**
 * Create StorageDiff from address and changes
 *
 * @param {import('../Address/AddressType.js').AddressType} address - Contract address
 * @param {Map<import('../State/StorageKeyType.js').StorageKeyType, import('./StorageDiffType.js').StorageChange> | Array<[import('../State/StorageKeyType.js').StorageKeyType, import('./StorageDiffType.js').StorageChange]>} changes - Storage changes
 * @returns {import('./StorageDiffType.js').StorageDiffType} StorageDiff
 *
 * @example
 * ```typescript
 * const diff = StorageDiff.from(address, new Map([[key, { from: null, to: value }]]));
 * const diff2 = StorageDiff.from(address, [[key, { from: oldVal, to: newVal }]]);
 * ```
 */
export function from(address, changes) {
    if (!address) {
        throw new Error("Address is required for StorageDiff");
    }
    // Convert to Map if array provided
    const changesMap = changes instanceof Map ? changes : new Map(changes || []);
    return {
        address,
        changes: changesMap,
    };
}
