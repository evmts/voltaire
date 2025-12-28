// From Type file
export type { Bytes32Type, Bytes32Like } from "./Bytes32Type.js";
import type { Bytes32Like, Bytes32Type } from "./Bytes32Type.js";
export { SIZE } from "./Bytes32Type.js";
// From constants
export { ZERO } from "./constants.js";

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

// Callable constructor
export function Bytes32(value: Bytes32Like): Bytes32Type {
	return from(value);
}

// Static constructors
Bytes32.from = from;
Bytes32.fromBytes = fromBytes;
Bytes32.fromHex = fromHex;
Bytes32.fromNumber = fromNumber;
Bytes32.fromBigint = fromBigint;

// Static factory methods
Bytes32.zero = zero;

// Static utility methods
Bytes32.toHex = toHex;
Bytes32.toUint8Array = toUint8Array;
Bytes32.toBigint = toBigint;
Bytes32.toHash = toHash;
Bytes32.toAddress = toAddress;
Bytes32.equals = equals;
Bytes32.compare = compare;
Bytes32.clone = clone;
Bytes32.size = size;
Bytes32.isZero = isZero;

// Constants
Bytes32.SIZE = SIZE;
Bytes32.ZERO = ZERO;
