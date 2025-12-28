// From Type file
export type { Bytes16Type, Bytes16Like } from "./Bytes16Type.js";
import type { Bytes16Like, Bytes16Type } from "./Bytes16Type.js";
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

// Callable constructor
export function Bytes16(value: Bytes16Like): Bytes16Type {
	return from(value);
}

// Static constructors
Bytes16.from = from;
Bytes16.fromBytes = fromBytes;
Bytes16.fromHex = fromHex;

// Static factory methods
Bytes16.zero = zero;
Bytes16.random = () => {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return fromBytes(bytes);
};

// Static utility methods
Bytes16.toHex = toHex;
Bytes16.toUint8Array = toUint8Array;
Bytes16.equals = equals;
Bytes16.compare = compare;
Bytes16.clone = clone;
Bytes16.size = size;
Bytes16.isZero = isZero;

// Constants
Bytes16.SIZE = SIZE;
Bytes16.ZERO = ZERO;
