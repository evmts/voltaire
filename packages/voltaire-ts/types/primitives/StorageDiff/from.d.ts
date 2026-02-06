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
export function from(address: import("../Address/AddressType.js").AddressType, changes: Map<import("../State/StorageKeyType.js").StorageKeyType, import("./StorageDiffType.js").StorageChange> | Array<[import("../State/StorageKeyType.js").StorageKeyType, import("./StorageDiffType.js").StorageChange]>): import("./StorageDiffType.js").StorageDiffType;
//# sourceMappingURL=from.d.ts.map