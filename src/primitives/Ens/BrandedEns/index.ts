// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedEns.js";

import { from } from "./from.js";
import { normalize as _normalize } from "./normalize.js";
import { beautify as _beautify } from "./beautify.js";
import { namehash as _namehash } from "./namehash.js";
import { labelhash as _labelhash } from "./labelhash.js";
import { is } from "./is.js";
import { toString } from "./toString.js";

// Internal exports
export { from, _normalize, _beautify, _namehash, _labelhash, is, toString };

// Public wrappers that auto-convert
export function normalize(name: string | import("./BrandedEns.js").BrandedEns) {
	return _normalize(from(String(name)));
}

export function beautify(name: string | import("./BrandedEns.js").BrandedEns) {
	return _beautify(from(String(name)));
}

export function namehash(name: string | import("./BrandedEns.js").BrandedEns) {
	return _namehash(from(String(name)));
}

export function labelhash(
	label: string | import("./BrandedEns.js").BrandedEns,
) {
	return _labelhash(from(String(label)));
}
