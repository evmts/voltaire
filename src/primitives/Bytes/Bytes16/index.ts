// From Type file
export type { Bytes16Type, Bytes16Like } from "./Bytes16Type.js";
export { SIZE } from "./Bytes16Type.js";
// From constants
export { ZERO } from "./constants.js";

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
export const BytesType16 = {
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
