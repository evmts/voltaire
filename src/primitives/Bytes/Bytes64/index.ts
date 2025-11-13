// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedBytes64.js";

import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { SIZE, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isZero } from "./isZero.js";
import { size } from "./size.js";
import { toHex } from "./toHex.js";
import { toUint8Array } from "./toUint8Array.js";
import { zero } from "./zero.js";

// Export individual functions
export {
	from,
	fromBytes,
	fromHex,
	toHex,
	toUint8Array,
	equals,
	compare,
	clone,
	size,
	zero,
	isZero,
};

// Namespace export
export const BrandedBytes64 = {
	from,
	fromBytes,
	fromHex,
	toHex,
	toUint8Array,
	equals,
	compare,
	clone,
	size,
	zero,
	isZero,
	SIZE,
	ZERO,
};
