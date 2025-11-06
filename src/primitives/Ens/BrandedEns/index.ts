// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedEns.js";

import { from } from "./from.js";
import { normalize as _normalize } from "./normalize.js";
import { beautify as _beautify } from "./beautify.js";
import { is } from "./is.js";
import { toString } from "./toString.js";

// Internal exports
export { from, _normalize, _beautify, is, toString };

// Public wrappers that auto-convert
export function normalize(name: string | import("./BrandedEns.js").BrandedEns) {
	return _normalize(from(String(name)));
}

export function beautify(name: string | import("./BrandedEns.js").BrandedEns) {
	return _beautify(from(String(name)));
}
