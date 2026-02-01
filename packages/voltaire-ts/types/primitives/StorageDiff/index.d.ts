export type { StorageChange, StorageDiffType, } from "./StorageDiffType.js";
import { from as _from } from "./from.js";
import { getChange as _getChange } from "./getChange.js";
import { getKeys as _getKeys } from "./getKeys.js";
import { size as _size } from "./size.js";
export { from } from "./from.js";
export declare function getChange(diff: import("./StorageDiffType.js").StorageDiffType | [
    import("../Address/AddressType.js").AddressType,
    Map<import("../State/StorageKeyType.js").StorageKeyType, import("./StorageDiffType.js").StorageChange>
], key: import("../State/StorageKeyType.js").StorageKeyType): import("./StorageDiffType.js").StorageChange | undefined;
export declare function getKeys(diff: import("./StorageDiffType.js").StorageDiffType | [
    import("../Address/AddressType.js").AddressType,
    Map<import("../State/StorageKeyType.js").StorageKeyType, import("./StorageDiffType.js").StorageChange>
]): Array<import("../State/StorageKeyType.js").StorageKeyType>;
export declare function size(diff: import("./StorageDiffType.js").StorageDiffType | [
    import("../Address/AddressType.js").AddressType,
    Map<import("../State/StorageKeyType.js").StorageKeyType, import("./StorageDiffType.js").StorageChange>
]): number;
export { _getChange, _getKeys, _size };
export declare const StorageDiff: {
    from: typeof _from;
    getChange: typeof getChange;
    getKeys: typeof getKeys;
    size: typeof size;
};
//# sourceMappingURL=index.d.ts.map