// @ts-nocheck
import { abs } from "./abs.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { clone } from "./clone.js";
import { MAX, MIN, MINUS_ONE, ONE, SIZE, ZERO } from "./constants.js";
import { dividedBy } from "./dividedBy.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { greaterThan } from "./greaterThan.js";
import { isNegative } from "./isNegative.js";
import { isPositive } from "./isPositive.js";
import { isValid } from "./isValid.js";
import { isZero } from "./isZero.js";
import { lessThan } from "./lessThan.js";
import { maximum } from "./maximum.js";
import { minimum } from "./minimum.js";
import { minus } from "./minus.js";
import { modulo } from "./modulo.js";
import { negate } from "./negate.js";
import { plus } from "./plus.js";
import { shiftLeft } from "./shiftLeft.js";
import { shiftRight } from "./shiftRight.js";
import { sign } from "./sign.js";
import { times } from "./times.js";
import { toBigInt } from "./toBigInt.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
import { toString } from "./toString.js";

/**
 * @typedef {import('./Int32Type.js').BrandedInt32} BrandedInt32
 */

/**
 * Create Int32 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt32}
 *
 * @example
 * ```javascript
 * import { Int32 } from '@tevm/voltaire';
 *
 * const a = Int32(-100000);
 * const b = Int32("0xfffe7960");
 * ```
 */
export function Int32(value) {
	return from(value);
}

// Static constructors
Int32.from = from;
Int32.fromHex = fromHex;
Int32.fromBigInt = fromBigInt;
Int32.fromNumber = fromNumber;
Int32.fromBytes = fromBytes;

// Validation
Int32.isValid = isValid;

// Conversions
Int32.toHex = toHex;
Int32.toBigInt = toBigInt;
Int32.toNumber = toNumber;
Int32.toBytes = toBytes;
Int32.toString = toString;

// Utilities
Int32.clone = clone;

// Arithmetic
Int32.plus = plus;
Int32.minus = minus;
Int32.times = times;
Int32.dividedBy = dividedBy;
Int32.modulo = modulo;
Int32.abs = abs;
Int32.negate = negate;

// Bitwise
Int32.bitwiseAnd = bitwiseAnd;
Int32.bitwiseOr = bitwiseOr;
Int32.bitwiseXor = bitwiseXor;
Int32.bitwiseNot = bitwiseNot;
Int32.shiftLeft = shiftLeft;
Int32.shiftRight = shiftRight;

// Comparison
Int32.equals = equals;
Int32.lessThan = lessThan;
Int32.greaterThan = greaterThan;
Int32.isZero = isZero;
Int32.isNegative = isNegative;
Int32.isPositive = isPositive;
Int32.minimum = minimum;
Int32.maximum = maximum;
Int32.sign = sign;

// Constants
Int32.MAX = MAX;
Int32.MIN = MIN;
Int32.ZERO = ZERO;
Int32.ONE = ONE;
Int32.MINUS_ONE = MINUS_ONE;
Int32.SIZE = SIZE;
