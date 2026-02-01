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
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
import { toString } from "./toString.js";
/**
 * @typedef {import('./Int64Type.js').BrandedInt64} BrandedInt64
 */
/**
 * Create Int64 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {BrandedInt64}
 *
 * @example
 * ```javascript
 * import { Int64 } from '@tevm/voltaire';
 *
 * const a = Int64(-1000000000000n);
 * const b = Int64("0xffffff172b5af000");
 * ```
 */
export function Int64(value) {
    return from(value);
}
// Static constructors
Int64.from = from;
Int64.fromHex = fromHex;
Int64.fromBigInt = fromBigInt;
Int64.fromNumber = fromNumber;
Int64.fromBytes = fromBytes;
// Validation
Int64.isValid = isValid;
// Conversions
Int64.toHex = toHex;
Int64.toBigInt = toBigInt;
Int64.toNumber = toNumber;
Int64.toBytes = toBytes;
Int64.toString = toString;
// Utilities
Int64.clone = clone;
// Arithmetic
Int64.plus = plus;
Int64.minus = minus;
Int64.times = times;
Int64.dividedBy = dividedBy;
Int64.modulo = modulo;
Int64.abs = abs;
Int64.negate = negate;
// Bitwise
Int64.bitwiseAnd = bitwiseAnd;
Int64.bitwiseOr = bitwiseOr;
Int64.bitwiseXor = bitwiseXor;
Int64.bitwiseNot = bitwiseNot;
Int64.shiftLeft = shiftLeft;
Int64.shiftRight = shiftRight;
// Comparison
Int64.equals = equals;
Int64.lessThan = lessThan;
Int64.greaterThan = greaterThan;
Int64.isZero = isZero;
Int64.isNegative = isNegative;
Int64.isPositive = isPositive;
Int64.minimum = minimum;
Int64.maximum = maximum;
Int64.sign = sign;
// Constants
Int64.MAX = MAX;
Int64.MIN = MIN;
Int64.ZERO = ZERO;
Int64.ONE = ONE;
Int64.MINUS_ONE = MINUS_ONE;
Int64.SIZE = SIZE;
