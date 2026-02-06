/**
 * Bytes32 - Fixed-size 32-byte array type
 *
 * Generic 32-byte data structure used throughout Ethereum for various purposes
 * including storage values, contract data, and numeric representations.
 *
 * @module
 */
export type { Bytes32Like, Bytes32Type } from "./Bytes32Type.js";
export { SIZE, ZERO } from "./constants.js";
export * from "./errors.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigint } from "./fromBigint.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { isZero } from "./isZero.js";
import { max } from "./max.js";
import { min } from "./min.js";
import { toBigint } from "./toBigint.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
import { zero } from "./zero.js";
export { from, fromBytes, fromHex, fromNumber, fromBigint, toHex, toNumber, toBigint, equals, compare, isZero, clone, zero, bitwiseAnd, bitwiseOr, bitwiseXor, min, max, };
export { bitwiseAnd as _bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseOr as _bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor as _bitwiseXor } from "./bitwiseXor.js";
export { clone as _clone } from "./clone.js";
export { compare as _compare } from "./compare.js";
export { equals as _equals } from "./equals.js";
export { from as _from } from "./from.js";
export { fromBigint as _fromBigint } from "./fromBigint.js";
export { fromBytes as _fromBytes } from "./fromBytes.js";
export { fromHex as _fromHex } from "./fromHex.js";
export { fromNumber as _fromNumber } from "./fromNumber.js";
export { isZero as _isZero } from "./isZero.js";
export { max as _max } from "./max.js";
export { min as _min } from "./min.js";
export { toBigint as _toBigint } from "./toBigint.js";
export { toHex as _toHex } from "./toHex.js";
export { toNumber as _toNumber } from "./toNumber.js";
export { zero as _zero } from "./zero.js";
export declare const Bytes32: {
    from: typeof from;
    fromBytes: typeof fromBytes;
    fromHex: typeof fromHex;
    fromNumber: typeof fromNumber;
    fromBigint: typeof fromBigint;
    toHex: typeof toHex;
    toNumber: typeof toNumber;
    toBigint: typeof toBigint;
    equals: typeof equals;
    compare: typeof compare;
    isZero: typeof isZero;
    clone: typeof clone;
    zero: typeof zero;
    bitwiseAnd: typeof bitwiseAnd;
    bitwiseOr: typeof bitwiseOr;
    bitwiseXor: typeof bitwiseXor;
    min: typeof min;
    max: typeof max;
    SIZE: number;
    ZERO: import("./Bytes32Type.js").Bytes32Type;
};
export default Bytes32;
//# sourceMappingURL=index.d.ts.map