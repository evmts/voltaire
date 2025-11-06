// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedBloomFilter.js";

import { add } from "./add.js";
import { combine } from "./combine.js";
import { contains } from "./contains.js";
import { create } from "./create.js";
import { density } from "./density.js";
import { expectedFalsePositiveRate } from "./expectedFalsePositiveRate.js";
import { fromHex } from "./fromHex.js";
import { hash } from "./hash.js";
import { isEmpty } from "./isEmpty.js";
import { merge } from "./merge.js";
import { toHex } from "./toHex.js";

// Export individual functions
export {
	add,
	combine,
	contains,
	create,
	density,
	expectedFalsePositiveRate,
	fromHex,
	hash,
	isEmpty,
	merge,
	toHex,
};

// Namespace export
export const BrandedBloomFilter = {
	add,
	combine,
	contains,
	create,
	density,
	expectedFalsePositiveRate,
	fromHex,
	hash,
	isEmpty,
	merge,
	toHex,
};
