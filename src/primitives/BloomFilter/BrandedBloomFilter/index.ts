// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedBloomFilter.js";

import { add } from "./add.js";
import { contains } from "./contains.js";
import { create } from "./create.js";
import { fromHex } from "./fromHex.js";
import { hash } from "./hash.js";
import { isEmpty } from "./isEmpty.js";
import { merge } from "./merge.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { add, contains, create, fromHex, hash, isEmpty, merge, toHex };

// Namespace export
export const BrandedBloomFilter = {
	add,
	contains,
	create,
	fromHex,
	hash,
	isEmpty,
	merge,
	toHex,
};
