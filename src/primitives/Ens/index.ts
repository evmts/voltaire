export * from "./errors.js";
export type { EnsType as Ens } from "./EnsType.js";

import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import type { EnsType } from "./EnsType.js";

// Import .js files with proper type annotations
import { beautify as _beautifyImpl } from "./beautify.js";
import { from as fromImpl } from "./from.js";
import { is as isImpl } from "./is.js";
import { isValid as isValidImpl } from "./isValid.js";
import { Labelhash as LabelhashImpl } from "./labelhash.js";
import { Namehash as NamehashImpl } from "./namehash.js";
import { normalize as _normalizeImpl } from "./normalize.js";
import { toString as toStringImpl } from "./toString.js";
import { validate as validateImpl } from "./validate.js";

// Type-safe wrappers for .js imports
const _beautify: (name: EnsType) => EnsType = _beautifyImpl;
const from: (name: string) => EnsType = fromImpl;
const is: (value: unknown) => value is EnsType = isImpl;
const isValid: (name: string) => boolean = isValidImpl;
const Labelhash: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
}) => (label: EnsType) => Uint8Array = LabelhashImpl;
const Namehash: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
}) => (name: EnsType) => Uint8Array = NamehashImpl;
const _normalize: (name: EnsType) => EnsType = _normalizeImpl;
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the conventional method name for this pattern
const toString: (name: EnsType) => string = toStringImpl;
const validate: (name: string) => void = validateImpl;

// Factory exports (tree-shakeable)
export { Labelhash, Namehash };

// Internal method exports
const _namehash = Namehash({ keccak256 });
const _labelhash = Labelhash({ keccak256 });

// Internal exports
export {
	from,
	_normalize,
	_beautify,
	_namehash,
	_labelhash,
	is,
	toString,
	isValid,
	validate,
};

// Public wrappers that auto-convert
export function normalize(name: string | EnsType): EnsType {
	return _normalize(from(String(name)));
}

export function beautify(name: string | EnsType): EnsType {
	return _beautify(from(String(name)));
}

export function namehash(name: string | EnsType): Uint8Array {
	return _namehash(from(String(name)));
}

export function labelhash(label: string | EnsType): Uint8Array {
	return _labelhash(from(String(label)));
}
