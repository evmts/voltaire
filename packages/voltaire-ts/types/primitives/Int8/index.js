// Arithmetic - internal API
export { abs as _abs, dividedBy as _dividedBy, minus as _minus, modulo as _modulo, negate as _negate, plus as _plus, times as _times, } from "./arithmetic.js";
// Bitwise - internal API
export { and as _and, not as _not, or as _or, shiftLeft as _shiftLeft, shiftRight as _shiftRight, xor as _xor, } from "./bitwise.js";
// Comparison - internal API
export { equals as _equals, greaterThan as _greaterThan, isNegative as _isNegative, isPositive as _isPositive, isZero as _isZero, lessThan as _lessThan, maximum as _maximum, minimum as _minimum, sign as _sign, } from "./comparison.js";
// Conversions - internal API (no conversion needed)
export { toBigint as _toBigint, toBytes as _toBytes, toHex as _toHex, toNumber as _toNumber, toString as _toString, } from "./conversions.js";
// Constructors - no wrapper needed
export { from, fromBigint, fromBytes, fromHex, fromNumber } from "./from.js";
export { INT8_MAX, INT8_MIN } from "./Int8Type.js";
// Utilities - internal API
export { bitLength as _bitLength, isValid, leadingZeros as _leadingZeros, popCount as _popCount, } from "./utilities.js";
import * as arith from "./arithmetic.js";
import * as bit from "./bitwise.js";
import * as cmp from "./comparison.js";
import * as conv from "./conversions.js";
import { from } from "./from.js";
import * as util from "./utilities.js";
export function toNumber(value) {
    return conv.toNumber(from(value));
}
export function toBigint(value) {
    return conv.toBigint(from(value));
}
export function toHex(value) {
    return conv.toHex(from(value));
}
export function toBytes(value) {
    return conv.toBytes(from(value));
}
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional wrapper for branded type
export function toString(value) {
    return conv.toString(from(value));
}
export function plus(a, b) {
    return arith.plus(from(a), from(b));
}
export function minus(a, b) {
    return arith.minus(from(a), from(b));
}
export function times(a, b) {
    return arith.times(from(a), from(b));
}
export function dividedBy(a, b) {
    return arith.dividedBy(from(a), from(b));
}
export function modulo(a, b) {
    return arith.modulo(from(a), from(b));
}
export function abs(value) {
    return arith.abs(from(value));
}
export function negate(value) {
    return arith.negate(from(value));
}
export function equals(a, b) {
    return cmp.equals(from(a), from(b));
}
export function lessThan(a, b) {
    return cmp.lessThan(from(a), from(b));
}
export function greaterThan(a, b) {
    return cmp.greaterThan(from(a), from(b));
}
export function isZero(value) {
    return cmp.isZero(from(value));
}
export function isNegative(value) {
    return cmp.isNegative(from(value));
}
export function isPositive(value) {
    return cmp.isPositive(from(value));
}
export function minimum(a, b) {
    return cmp.minimum(from(a), from(b));
}
export function maximum(a, b) {
    return cmp.maximum(from(a), from(b));
}
export function sign(value) {
    return cmp.sign(from(value));
}
export function and(a, b) {
    return bit.and(from(a), from(b));
}
export function or(a, b) {
    return bit.or(from(a), from(b));
}
export function xor(a, b) {
    return bit.xor(from(a), from(b));
}
export function not(value) {
    return bit.not(from(value));
}
export function shiftLeft(value, shift) {
    return bit.shiftLeft(from(value), shift);
}
export function shiftRight(value, shift) {
    return bit.shiftRight(from(value), shift);
}
export function bitLength(value) {
    return util.bitLength(from(value));
}
export function leadingZeros(value) {
    return util.leadingZeros(from(value));
}
export function popCount(value) {
    return util.popCount(from(value));
}
