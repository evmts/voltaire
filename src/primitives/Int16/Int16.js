// @ts-nocheck
import * as arith from "./arithmetic.js";
import * as bit from "./bitwise.js";
import * as cmp from "./comparison.js";
import * as conv from "./conversions.js";
import { from, fromBigint, fromBytes, fromHex, fromNumber } from "./from.js";
import { INT16_MAX, INT16_MIN } from "./Int16Type.js";
import * as util from "./utilities.js";

/**
 * @typedef {import('./Int16Type.js').BrandedInt16} BrandedInt16
 */

/**
 * Create Int16 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt16}
 *
 * @example
 * ```javascript
 * import { Int16 } from '@tevm/voltaire';
 *
 * const a = Int16(-1000);
 * const b = Int16("0xfc18");
 * ```
 */
export function Int16(value) {
	return from(value);
}

// Static constructors
Int16.from = from;
Int16.fromHex = fromHex;
Int16.fromBigint = fromBigint;
Int16.fromNumber = fromNumber;
Int16.fromBytes = fromBytes;

// Validation
Int16.isValid = util.isValid;

// Conversions
Int16.toHex = conv.toHex;
Int16.toBigint = conv.toBigint;
Int16.toNumber = conv.toNumber;
Int16.toBytes = conv.toBytes;
Int16.toString = conv.toString;

// Arithmetic
Int16.plus = arith.plus;
Int16.minus = arith.minus;
Int16.times = arith.times;
Int16.dividedBy = arith.dividedBy;
Int16.modulo = arith.modulo;
Int16.abs = arith.abs;
Int16.negate = arith.negate;

// Bitwise
Int16.and = bit.and;
Int16.or = bit.or;
Int16.xor = bit.xor;
Int16.not = bit.not;
Int16.shiftLeft = bit.shiftLeft;
Int16.shiftRight = bit.shiftRight;

// Comparison
Int16.equals = cmp.equals;
Int16.lessThan = cmp.lessThan;
Int16.greaterThan = cmp.greaterThan;
Int16.isZero = cmp.isZero;
Int16.isNegative = cmp.isNegative;
Int16.isPositive = cmp.isPositive;
Int16.minimum = cmp.minimum;
Int16.maximum = cmp.maximum;
Int16.sign = cmp.sign;

// Bit operations
Int16.bitLength = util.bitLength;
Int16.leadingZeros = util.leadingZeros;
Int16.popCount = util.popCount;

// Constants
Int16.MAX = INT16_MAX;
Int16.MIN = INT16_MIN;
