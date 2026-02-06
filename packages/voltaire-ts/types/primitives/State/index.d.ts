export * from "./constants.js";
export * from "./StorageKeyType.js";
import type { AddressType } from "../Address/AddressType.js";
import { create as _createImpl } from "./create.js";
import { equals as _equalsImpl } from "./equals.js";
import { from as _fromImpl } from "./from.js";
import { fromString as _fromStringImpl } from "./fromString.js";
import { hashCode as _hashCodeImpl } from "./hashCode.js";
import { is as _isImpl } from "./is.js";
import type { StorageKeyLike, StorageKeyType } from "./StorageKeyType.js";
import { toString as _toStringImpl } from "./toString.js";
export declare const create: (address: AddressType, slot: bigint) => StorageKeyType;
export declare const from: (value: StorageKeyLike) => StorageKeyType;
export declare const is: (value: unknown) => value is StorageKeyType;
export declare const equals: (a: StorageKeyLike, b: StorageKeyLike) => boolean;
export declare const toString: (key: StorageKeyLike) => string;
export declare const fromString: (str: string) => StorageKeyType | undefined;
export declare const hashCode: (key: StorageKeyLike) => number;
export { _createImpl as _create, _fromImpl as _from, _isImpl as _is, _equalsImpl as _equals, _toStringImpl as _toString, _fromStringImpl as _fromString, _hashCodeImpl as _hashCode, };
export declare const StorageKey: {
    from: (value: StorageKeyLike) => StorageKeyType;
    create: (address: AddressType, slot: bigint) => StorageKeyType;
    is: (value: unknown) => value is StorageKeyType;
    equals: (a: StorageKeyLike, b: StorageKeyLike) => boolean;
    toString: (key: StorageKeyLike) => string;
    fromString: (str: string) => StorageKeyType | undefined;
    hashCode: (key: StorageKeyLike) => number;
};
/**
 * Factory function for creating StorageKey instances
 */
export declare function StorageKeyFactory(address: AddressType, slot: bigint): StorageKeyType;
export { StorageKeyFactory as default };
//# sourceMappingURL=index.d.ts.map