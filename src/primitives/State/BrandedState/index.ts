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

// Export individual functions
export { from, create, is, equals, toString, fromString, hashCode };

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
