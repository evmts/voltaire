export { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";
import { bitLength as _bitLength } from "./bitLength.js";
import { bitwiseAnd as _bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot as _bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr as _bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor as _bitwiseXor } from "./bitwiseXor.js";
import { clone as _clone } from "./clone.js";
import { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";
import { dividedBy as _dividedBy } from "./dividedBy.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromAbiEncoded as _fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBigInt as _fromBigInt } from "./fromBigInt.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromNumber as _fromNumber } from "./fromNumber.js";
import { gcd as _gcd } from "./gcd.js";
import { greaterThan as _greaterThan } from "./greaterThan.js";
import { greaterThanOrEqual as _greaterThanOrEqual } from "./greaterThanOrEqual.js";
import { isPowerOf2 as _isPowerOf2 } from "./isPowerOf2.js";
import { isValid as _isValid } from "./isValid.js";
import { isZero as _isZero } from "./isZero.js";
import { lcm as _lcm } from "./lcm.js";
import { leadingZeros as _leadingZeros } from "./leadingZeros.js";
import { lessThan as _lessThan } from "./lessThan.js";
import { lessThanOrEqual as _lessThanOrEqual } from "./lessThanOrEqual.js";
import { max as _max } from "./max.js";
import { maximum as _maximum } from "./maximum.js";
import { min as _min } from "./min.js";
import { minimum as _minimum } from "./minimum.js";
import { minus as _minus } from "./minus.js";
import { modulo as _modulo } from "./modulo.js";
import { notEquals as _notEquals } from "./notEquals.js";
import { plus as _plus } from "./plus.js";
import { popCount as _popCount } from "./popCount.js";
import { product as _product } from "./product.js";
import { shiftLeft as _shiftLeft } from "./shiftLeft.js";
import { shiftRight as _shiftRight } from "./shiftRight.js";
import { sum as _sum } from "./sum.js";
import { times as _times } from "./times.js";
import { toAbiEncoded as _toAbiEncoded } from "./toAbiEncoded.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { toPower as _toPower } from "./toPower.js";
import { toString as _toString } from "./toString.js";
import { tryFrom as _tryFrom } from "./tryFrom.js";
// Typed re-exports
export const from = _from;
export const fromHex = _fromHex;
export const fromBigInt = _fromBigInt;
export const fromNumber = _fromNumber;
export const fromBytes = _fromBytes;
export const fromAbiEncoded = _fromAbiEncoded;
export const tryFrom = _tryFrom;
export const isValid = _isValid;
export const toHex = _toHex;
export const toBigInt = _toBigInt;
export const toNumber = _toNumber;
export const toBytes = _toBytes;
export const toAbiEncoded = _toAbiEncoded;
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional override for branded type conversion
export const toString = _toString;
export const clone = _clone;
export const plus = _plus;
export const minus = _minus;
export const times = _times;
export const dividedBy = _dividedBy;
export const modulo = _modulo;
export const toPower = _toPower;
export const bitwiseAnd = _bitwiseAnd;
export const bitwiseOr = _bitwiseOr;
export const bitwiseXor = _bitwiseXor;
export const bitwiseNot = _bitwiseNot;
export const shiftLeft = _shiftLeft;
export const shiftRight = _shiftRight;
export const equals = _equals;
export const notEquals = _notEquals;
export const lessThan = _lessThan;
export const lessThanOrEqual = _lessThanOrEqual;
export const greaterThan = _greaterThan;
export const greaterThanOrEqual = _greaterThanOrEqual;
export const isZero = _isZero;
export const minimum = _minimum;
export const maximum = _maximum;
export const bitLength = _bitLength;
export const leadingZeros = _leadingZeros;
export const popCount = _popCount;
export const sum = _sum;
export const product = _product;
export const min = _min;
export const max = _max;
export const gcd = _gcd;
export const lcm = _lcm;
export const isPowerOf2 = _isPowerOf2;
// Namespace export
export const BrandedUint128 = {
    from,
    fromHex,
    fromBigInt,
    fromNumber,
    fromBytes,
    fromAbiEncoded,
    tryFrom,
    isValid,
    toHex,
    toBigInt,
    toNumber,
    toBytes,
    toAbiEncoded,
    toString,
    clone,
    plus,
    minus,
    times,
    dividedBy,
    modulo,
    toPower,
    bitwiseAnd,
    bitwiseOr,
    bitwiseXor,
    bitwiseNot,
    shiftLeft,
    shiftRight,
    equals,
    notEquals,
    lessThan,
    lessThanOrEqual,
    greaterThan,
    greaterThanOrEqual,
    isZero,
    minimum,
    maximum,
    bitLength,
    leadingZeros,
    popCount,
    sum,
    product,
    min,
    max,
    gcd,
    lcm,
    isPowerOf2,
    MAX,
    MIN,
    ZERO,
    ONE,
    SIZE,
};
