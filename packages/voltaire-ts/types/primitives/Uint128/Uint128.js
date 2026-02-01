// @ts-nocheck
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { clone } from "./clone.js";
import { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";
import { dividedBy } from "./dividedBy.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { gcd } from "./gcd.js";
import { greaterThan } from "./greaterThan.js";
import { greaterThanOrEqual } from "./greaterThanOrEqual.js";
import { isPowerOf2 } from "./isPowerOf2.js";
import { isValid } from "./isValid.js";
import { isZero } from "./isZero.js";
import { lcm } from "./lcm.js";
import { leadingZeros } from "./leadingZeros.js";
import { lessThan } from "./lessThan.js";
import { lessThanOrEqual } from "./lessThanOrEqual.js";
import { max } from "./max.js";
import { maximum } from "./maximum.js";
import { min } from "./min.js";
import { minimum } from "./minimum.js";
import { minus } from "./minus.js";
import { modulo } from "./modulo.js";
import { notEquals } from "./notEquals.js";
import { plus } from "./plus.js";
import { popCount } from "./popCount.js";
import { product } from "./product.js";
import { shiftLeft } from "./shiftLeft.js";
import { shiftRight } from "./shiftRight.js";
import { sum } from "./sum.js";
import { times } from "./times.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toBigInt } from "./toBigInt.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
import { toPower } from "./toPower.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the intended API name for this primitive
import { toString } from "./toString.js";
import { tryFrom } from "./tryFrom.js";
/**
 * @typedef {import('./Uint128Type.js').Uint128Type} Uint128Type
 */
/**
 * Create Uint128 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint128Type}
 *
 * @example
 * ```javascript
 * import { Uint128 } from '@tevm/voltaire';
 *
 * const a = Uint128(1000000000000000000000000n);
 * const b = Uint128("0xd3c21bcecceda1000000");
 * ```
 */
export function Uint128(value) {
    return from(value);
}
// Static constructors
Uint128.from = from;
Uint128.fromHex = fromHex;
Uint128.fromBigInt = fromBigInt;
Uint128.fromNumber = fromNumber;
Uint128.fromBytes = fromBytes;
Uint128.fromAbiEncoded = fromAbiEncoded;
Uint128.tryFrom = tryFrom;
// Validation
Uint128.isValid = isValid;
// Conversions
Uint128.toHex = toHex;
Uint128.toBigInt = toBigInt;
Uint128.toNumber = toNumber;
Uint128.toBytes = toBytes;
Uint128.toAbiEncoded = toAbiEncoded;
Uint128.toString = toString;
// Utilities
Uint128.clone = clone;
// Arithmetic
Uint128.plus = plus;
Uint128.minus = minus;
Uint128.times = times;
Uint128.dividedBy = dividedBy;
Uint128.modulo = modulo;
Uint128.toPower = toPower;
// Bitwise
Uint128.bitwiseAnd = bitwiseAnd;
Uint128.bitwiseOr = bitwiseOr;
Uint128.bitwiseXor = bitwiseXor;
Uint128.bitwiseNot = bitwiseNot;
Uint128.shiftLeft = shiftLeft;
Uint128.shiftRight = shiftRight;
// Comparison
Uint128.equals = equals;
Uint128.notEquals = notEquals;
Uint128.lessThan = lessThan;
Uint128.lessThanOrEqual = lessThanOrEqual;
Uint128.greaterThan = greaterThan;
Uint128.greaterThanOrEqual = greaterThanOrEqual;
Uint128.isZero = isZero;
Uint128.minimum = minimum;
Uint128.maximum = maximum;
// Bit operations
Uint128.bitLength = bitLength;
Uint128.leadingZeros = leadingZeros;
Uint128.popCount = popCount;
// Aggregate operations
Uint128.sum = sum;
Uint128.product = product;
Uint128.min = min;
Uint128.max = max;
// Math utilities
Uint128.gcd = gcd;
Uint128.lcm = lcm;
Uint128.isPowerOf2 = isPowerOf2;
// Constants
Uint128.MAX = MAX;
Uint128.MIN = MIN;
Uint128.ZERO = ZERO;
Uint128.ONE = ONE;
Uint128.SIZE = SIZE;
