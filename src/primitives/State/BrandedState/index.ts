// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedStorageKey.js";

import { create } from "./create.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromString } from "./fromString.js";
import { hashCode } from "./hashCode.js";
import { is } from "./is.js";
import { toString } from "./toString.js";

// Export individual functions (public API)
export { from, create, is, equals, toString, fromString, hashCode };

// Export internal functions (tree-shakeable)
export {
	from as _from,
	create as _create,
	is as _is,
	equals as _equals,
	toString as _toString,
	fromString as _fromString,
	hashCode as _hashCode,
};

// Namespace export
export const BrandedStorageKey = {
	from,
	create,
	is,
	equals,
	toString,
	fromString,
	hashCode,
};
