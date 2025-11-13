// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedBytes32.js";

import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { SIZE, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigint } from "./fromBigint.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { isZero } from "./isZero.js";
import { size } from "./size.js";
import { toAddress } from "./toAddress.js";
import { toBigint } from "./toBigint.js";
import { toHash } from "./toHash.js";
import { toHex } from "./toHex.js";
import { toUint8Array } from "./toUint8Array.js";
import { zero } from "./zero.js";

// Export individual functions
export {
	from,
	fromBytes,
	fromHex,
	fromNumber,
	fromBigint,
	toHex,
	toUint8Array,
	toBigint,
	toHash,
	toAddress,
	equals,
	compare,
	clone,
	size,
	zero,
	isZero,
};

// Namespace export
export const BrandedBytes32 = {
	from,
	fromBytes,
	fromHex,
	fromNumber,
	fromBigint,
	toHex,
	toUint8Array,
	toBigint,
	toHash,
	toAddress,
	equals,
	compare,
	clone,
	size,
	zero,
	isZero,
	SIZE,
	ZERO,
};
