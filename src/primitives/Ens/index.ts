// @ts-nocheck
export * from "./errors.js";
export type { EnsType as Ens } from "./EnsType.js";

import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { beautify as _beautify } from "./beautify.js";
import { from } from "./from.js";
import { is } from "./is.js";
import { Labelhash } from "./labelhash.js";
import { Namehash } from "./namehash.js";
import { normalize as _normalize } from "./normalize.js";
import { toString } from "./toString.js";

// Factory exports (tree-shakeable)
export { Labelhash, Namehash };

// Internal method exports
const _namehash = Namehash({ keccak256 });
const _labelhash = Labelhash({ keccak256 });

// Internal exports
export { from, _normalize, _beautify, _namehash, _labelhash, is, toString };

// Public wrappers that auto-convert
export function normalize(name: string | import("./EnsType.js").EnsType) {
	return _normalize(from(String(name)));
}

export function beautify(name: string | import("./EnsType.js").EnsType) {
	return _beautify(from(String(name)));
}

export function namehash(name: string | import("./EnsType.js").EnsType) {
	return _namehash(from(String(name)));
}

export function labelhash(label: string | import("./EnsType.js").EnsType) {
	return _labelhash(from(String(label)));
}
