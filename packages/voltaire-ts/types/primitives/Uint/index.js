// Import functions with explicit types
export { bitLength } from "./bitLength.js";
export { bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseNot } from "./bitwiseNot.js";
export { bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor } from "./bitwiseXor.js";
export { clone } from "./clone.js";
export * from "./constants.js";
export { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";
export { dividedBy } from "./dividedBy.js";
export { equals } from "./equals.js";
export { from } from "./from.js";
export { fromAbiEncoded } from "./fromAbiEncoded.js";
export { fromBigInt } from "./fromBigInt.js";
export { fromBytes } from "./fromBytes.js";
export { fromHex } from "./fromHex.js";
export { fromNumber } from "./fromNumber.js";
export { gcd } from "./gcd.js";
export { greaterThan } from "./greaterThan.js";
export { greaterThanOrEqual } from "./greaterThanOrEqual.js";
export { isPowerOf2 } from "./isPowerOf2.js";
export { isUint256 } from "./isUint256.js";
export { isValid } from "./isValid.js";
export { isZero } from "./isZero.js";
export { lcm } from "./lcm.js";
export { leadingZeros } from "./leadingZeros.js";
export { lessThan } from "./lessThan.js";
export { lessThanOrEqual } from "./lessThanOrEqual.js";
export { max } from "./max.js";
export { maximum } from "./maximum.js";
export { min } from "./min.js";
export { minimum } from "./minimum.js";
export { minus } from "./minus.js";
export { modulo } from "./modulo.js";
export { notEquals } from "./notEquals.js";
export { plus } from "./plus.js";
export { popCount } from "./popCount.js";
export { product } from "./product.js";
export { shiftLeft } from "./shiftLeft.js";
export { shiftRight } from "./shiftRight.js";
export { sum } from "./sum.js";
export { times } from "./times.js";
export { toAbiEncoded } from "./toAbiEncoded.js";
export { toBigInt } from "./toBigInt.js";
export { toBytes } from "./toBytes.js";
export { toHex } from "./toHex.js";
export { toNumber } from "./toNumber.js";
export { toPower } from "./toPower.js";
export { toString } from "./toString.js";
export { tryFrom } from "./tryFrom.js";
// Import for namespace
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
// Namespace export
const _Uint256Namespace = {
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
export { _Uint256Namespace as Uint256Type, _Uint256Namespace as Uint256 };
