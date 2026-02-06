// @ts-nocheck
import { abs } from "./abs.js";
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { BITS, MAX, MIN, MODULO, NEG_ONE, ONE, SIZE, ZERO, } from "./constants.js";
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
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
import { toString } from "./toString.js";
/**
 * @typedef {import('./Int128Type.js').BrandedInt128} BrandedInt128
 */
/**
 * Create Int128 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt128}
 *
 * @example
 * ```javascript
 * import { Int128 } from '@tevm/voltaire';
 *
 * const a = Int128(-1000000000000000000000n);
 * const b = Int128("0xffffffffffffffffffc9f2c9cd04674edbb00000");
 * ```
 */
export function Int128(value) {
    return from(value);
}
// Static constructors
Int128.from = from;
Int128.fromHex = fromHex;
Int128.fromBigInt = fromBigInt;
Int128.fromNumber = fromNumber;
Int128.fromBytes = fromBytes;
// Validation
Int128.isValid = isValid;
// Conversions
Int128.toHex = toHex;
Int128.toBigInt = toBigInt;
Int128.toNumber = toNumber;
Int128.toBytes = toBytes;
Int128.toString = toString;
// Arithmetic
Int128.plus = plus;
Int128.minus = minus;
Int128.times = times;
Int128.dividedBy = dividedBy;
Int128.modulo = modulo;
Int128.abs = abs;
Int128.negate = negate;
// Bitwise
Int128.bitwiseAnd = bitwiseAnd;
Int128.bitwiseOr = bitwiseOr;
Int128.bitwiseXor = bitwiseXor;
Int128.bitwiseNot = bitwiseNot;
Int128.shiftLeft = shiftLeft;
Int128.shiftRight = shiftRight;
// Comparison
Int128.equals = equals;
Int128.lessThan = lessThan;
Int128.greaterThan = greaterThan;
Int128.isZero = isZero;
Int128.isNegative = isNegative;
Int128.isPositive = isPositive;
Int128.minimum = minimum;
Int128.maximum = maximum;
Int128.sign = sign;
// Bit operations
Int128.bitLength = bitLength;
Int128.leadingZeros = leadingZeros;
Int128.popCount = popCount;
// Constants
Int128.MAX = MAX;
Int128.MIN = MIN;
Int128.ZERO = ZERO;
Int128.ONE = ONE;
Int128.NEG_ONE = NEG_ONE;
Int128.SIZE = SIZE;
Int128.BITS = BITS;
Int128.MODULO = MODULO;
