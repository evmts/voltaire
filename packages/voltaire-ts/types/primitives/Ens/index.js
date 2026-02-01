export * from "./errors.js";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
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
const _beautify = _beautifyImpl;
const from = fromImpl;
const is = isImpl;
const isValid = isValidImpl;
const Labelhash = LabelhashImpl;
const Namehash = NamehashImpl;
const _normalize = _normalizeImpl;
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the conventional method name for this pattern
const toString = toStringImpl;
const validate = validateImpl;
// Factory exports (tree-shakeable)
export { Labelhash, Namehash };
// Internal method exports
const _namehash = Namehash({ keccak256 });
const _labelhash = Labelhash({ keccak256 });
// Internal exports
export { from, _normalize, _beautify, _namehash, _labelhash, is, toString, isValid, validate, };
// Public wrappers that auto-convert
export function normalize(name) {
    return _normalize(from(String(name)));
}
export function beautify(name) {
    return _beautify(from(String(name)));
}
export function namehash(name) {
    return _namehash(from(String(name)));
}
export function labelhash(label) {
    return _labelhash(from(String(label)));
}
