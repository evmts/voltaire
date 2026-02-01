// @ts-nocheck
import * as arith from "./arithmetic.js";
import * as bit from "./bitwise.js";
import * as cmp from "./comparison.js";
import * as conv from "./conversions.js";
import { from, fromBigint, fromBytes, fromHex, fromNumber } from "./from.js";
import { INT8_MAX, INT8_MIN } from "./Int8Type.js";
import * as util from "./utilities.js";
/**
 * @typedef {import('./Int8Type.js').BrandedInt8} BrandedInt8
 */
/**
 * Create Int8 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt8}
 *
 * @example
 * ```javascript
 * import { Int8 } from '@tevm/voltaire';
 *
 * const a = Int8(-42);
 * const b = Int8("0xd6");
 * ```
 */
export function Int8(value) {
    return from(value);
}
// Static constructors
Int8.from = from;
Int8.fromHex = fromHex;
Int8.fromBigint = fromBigint;
Int8.fromNumber = fromNumber;
Int8.fromBytes = fromBytes;
// Validation
Int8.isValid = util.isValid;
// Conversions
Int8.toHex = conv.toHex;
Int8.toBigint = conv.toBigint;
Int8.toNumber = conv.toNumber;
Int8.toBytes = conv.toBytes;
Int8.toString = conv.toString;
// Arithmetic
Int8.plus = arith.plus;
Int8.minus = arith.minus;
Int8.times = arith.times;
Int8.dividedBy = arith.dividedBy;
Int8.modulo = arith.modulo;
Int8.abs = arith.abs;
Int8.negate = arith.negate;
// Bitwise
Int8.and = bit.and;
Int8.or = bit.or;
Int8.xor = bit.xor;
Int8.not = bit.not;
Int8.shiftLeft = bit.shiftLeft;
Int8.shiftRight = bit.shiftRight;
// Comparison
Int8.equals = cmp.equals;
Int8.lessThan = cmp.lessThan;
Int8.greaterThan = cmp.greaterThan;
Int8.isZero = cmp.isZero;
Int8.isNegative = cmp.isNegative;
Int8.isPositive = cmp.isPositive;
Int8.minimum = cmp.minimum;
Int8.maximum = cmp.maximum;
Int8.sign = cmp.sign;
// Bit operations
Int8.bitLength = util.bitLength;
Int8.leadingZeros = util.leadingZeros;
Int8.popCount = util.popCount;
// Constants
Int8.MAX = INT8_MAX;
Int8.MIN = INT8_MIN;
