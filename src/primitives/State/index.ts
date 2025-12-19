export * from "./StorageKeyType.js";
export * from "./constants.js";

import type { AddressType } from "../Address/AddressType.js";
import type { StorageKeyLike, StorageKeyType } from "./StorageKeyType.js";

import { create as _createImpl } from "./create.js";
import { equals as _equalsImpl } from "./equals.js";
import { from as _fromImpl } from "./from.js";
import { fromString as _fromStringImpl } from "./fromString.js";
import { hashCode as _hashCodeImpl } from "./hashCode.js";
import { is as _isImpl } from "./is.js";
import { toString as _toStringImpl } from "./toString.js";

// Typed wrappers
export const create = _createImpl as (
	address: AddressType,
	slot: bigint,
) => StorageKeyType;

export const from = _fromImpl as (value: StorageKeyLike) => StorageKeyType;

export const is = _isImpl as (value: unknown) => value is StorageKeyType;

export const equals = _equalsImpl as (
	a: StorageKeyLike,
	b: StorageKeyLike,
) => boolean;

export const toString = _toStringImpl as (key: StorageKeyLike) => string;

export const fromString = _fromStringImpl as (
	str: string,
) => StorageKeyType | undefined;

export const hashCode = _hashCodeImpl as (key: StorageKeyLike) => number;

// Export internal functions (tree-shakeable)
export {
	_createImpl as _create,
	_fromImpl as _from,
	_isImpl as _is,
	_equalsImpl as _equals,
	_toStringImpl as _toString,
	_fromStringImpl as _fromString,
	_hashCodeImpl as _hashCode,
};

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
export function StorageKeyFactory(
	address: AddressType,
	slot: bigint,
): StorageKeyType {
	return create(address, slot);
}

export { StorageKeyFactory as default };
