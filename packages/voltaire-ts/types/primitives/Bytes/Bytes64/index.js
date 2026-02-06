export { SIZE } from "./Bytes64Type.js";
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
export { from, fromBytes, fromHex, toHex, toUint8Array, equals, compare, clone, size, zero, isZero, };
// Callable constructor
export function Bytes64(value) {
    return from(value);
}
// Static constructors
Bytes64.from = from;
Bytes64.fromBytes = fromBytes;
Bytes64.fromHex = fromHex;
// Static factory methods
Bytes64.zero = zero;
// Static utility methods
Bytes64.toHex = toHex;
Bytes64.toUint8Array = toUint8Array;
Bytes64.equals = equals;
Bytes64.compare = compare;
Bytes64.clone = clone;
Bytes64.size = size;
Bytes64.isZero = isZero;
// Constants
Bytes64.SIZE = SIZE;
Bytes64.ZERO = ZERO;
