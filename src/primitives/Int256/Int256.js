// @ts-nocheck
import { abs } from "./abs.js";
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import {
	BITS,
	MAX,
	MIN,
	MODULO,
	NEG_ONE,
	ONE,
	SIZE,
	ZERO,
} from "./constants.js";
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
import { leadingZeros } from "./leadingZeros.js";
import { lessThan } from "./lessThan.js";
import { maximum } from "./maximum.js";
import { minimum } from "./minimum.js";
import { minus } from "./minus.js";
import { modulo } from "./modulo.js";
import { negate } from "./negate.js";
import { plus } from "./plus.js";
import { popCount } from "./popCount.js";
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
 * @typedef {import('./Int256Type.js').BrandedInt256} BrandedInt256
 */

/**
 * Create Int256 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt256}
 *
 * @example
 * ```javascript
 * import { Int256 } from '@tevm/voltaire';
 *
 * const a = Int256(-1000000000000000000000000000000n);
 * const b = Int256("0xff..."); // 256-bit hex
 * ```
 */
export function Int256(value) {
	return from(value);
}

// Static constructors
Int256.from = from;
Int256.fromHex = fromHex;
Int256.fromBigInt = fromBigInt;
Int256.fromNumber = fromNumber;
Int256.fromBytes = fromBytes;

// Validation
Int256.isValid = isValid;

// Conversions
Int256.toHex = toHex;
Int256.toBigInt = toBigInt;
Int256.toNumber = toNumber;
Int256.toBytes = toBytes;
Int256.toString = toString;

// Arithmetic
Int256.plus = plus;
Int256.minus = minus;
Int256.times = times;
Int256.dividedBy = dividedBy;
Int256.modulo = modulo;
Int256.abs = abs;
Int256.negate = negate;

// Bitwise
Int256.bitwiseAnd = bitwiseAnd;
Int256.bitwiseOr = bitwiseOr;
Int256.bitwiseXor = bitwiseXor;
Int256.bitwiseNot = bitwiseNot;
Int256.shiftLeft = shiftLeft;
Int256.shiftRight = shiftRight;

// Comparison
Int256.equals = equals;
Int256.lessThan = lessThan;
Int256.greaterThan = greaterThan;
Int256.isZero = isZero;
Int256.isNegative = isNegative;
Int256.isPositive = isPositive;
Int256.minimum = minimum;
Int256.maximum = maximum;
Int256.sign = sign;

// Bit operations
Int256.bitLength = bitLength;
Int256.leadingZeros = leadingZeros;
Int256.popCount = popCount;

// Constants
Int256.MAX = MAX;
Int256.MIN = MIN;
Int256.ZERO = ZERO;
Int256.ONE = ONE;
Int256.NEG_ONE = NEG_ONE;
Int256.SIZE = SIZE;
Int256.BITS = BITS;
Int256.MODULO = MODULO;
