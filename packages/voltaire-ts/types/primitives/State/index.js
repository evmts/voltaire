export * from "./constants.js";
export * from "./StorageKeyType.js";
import { create as _createImpl } from "./create.js";
import { equals as _equalsImpl } from "./equals.js";
import { from as _fromImpl } from "./from.js";
import { fromString as _fromStringImpl } from "./fromString.js";
import { hashCode as _hashCodeImpl } from "./hashCode.js";
import { is as _isImpl } from "./is.js";
import { toString as _toStringImpl } from "./toString.js";
// Typed wrappers
export const create = _createImpl;
export const from = _fromImpl;
export const is = _isImpl;
export const equals = _equalsImpl;
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional override for branded type conversion
export const toString = _toStringImpl;
export const fromString = _fromStringImpl;
export const hashCode = _hashCodeImpl;
// Export internal functions (tree-shakeable)
export { _createImpl as _create, _fromImpl as _from, _isImpl as _is, _equalsImpl as _equals, _toStringImpl as _toString, _fromStringImpl as _fromString, _hashCodeImpl as _hashCode, };
// Namespace export
export const StorageKey = {
    from,
    create,
    is,
    equals,
    toString,
    fromString,
    hashCode,
};
/**
 * Factory function for creating StorageKey instances
 */
export function StorageKeyFactory(address, slot) {
    return create(address, slot);
}
export { StorageKeyFactory as default };
