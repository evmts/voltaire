// Arithmetic - internal API
export {
	abs as _abs,
	dividedBy as _dividedBy,
	minus as _minus,
	modulo as _modulo,
	negate as _negate,
	plus as _plus,
	times as _times,
} from "./arithmetic.js";
// Bitwise - internal API
export {
	and as _and,
	not as _not,
	or as _or,
	shiftLeft as _shiftLeft,
	shiftRight as _shiftRight,
	xor as _xor,
} from "./bitwise.js";
// Comparison - internal API
export {
	equals as _equals,
	greaterThan as _greaterThan,
	isNegative as _isNegative,
	isPositive as _isPositive,
	isZero as _isZero,
	lessThan as _lessThan,
	maximum as _maximum,
	minimum as _minimum,
	sign as _sign,
} from "./comparison.js";

// Conversions - internal API (no conversion needed)
export {
	toBigint as _toBigint,
	toBytes as _toBytes,
	toHex as _toHex,
	toNumber as _toNumber,
	toString as _toString,
} from "./conversions.js";
// Constructors - no wrapper needed
export { from, fromBigint, fromBytes, fromHex, fromNumber } from "./from.js";
export type { BrandedInt8 } from "./Int8Type.js";
export { INT8_MAX, INT8_MIN } from "./Int8Type.js";

// Utilities - internal API
export {
	bitLength as _bitLength,
	isValid,
	leadingZeros as _leadingZeros,
	popCount as _popCount,
} from "./utilities.js";

import * as arith from "./arithmetic.js";
import * as bit from "./bitwise.js";
import * as cmp from "./comparison.js";
import * as conv from "./conversions.js";
import { from } from "./from.js";
// Public wrappers (auto-convert inputs)
import type { BrandedInt8 } from "./Int8Type.js";
import * as util from "./utilities.js";

export type Int8Input = number | bigint | string | BrandedInt8;

export function toNumber(value: Int8Input): number {
	return conv.toNumber(from(value));
}

export function toBigint(value: Int8Input): bigint {
	return conv.toBigint(from(value));
}

export function toHex(value: Int8Input): string {
	return conv.toHex(from(value));
}

export function toBytes(value: Int8Input): Uint8Array {
	return conv.toBytes(from(value));
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional wrapper for branded type
export function toString(value: Int8Input): string {
	return conv.toString(from(value));
}

export function plus(a: Int8Input, b: Int8Input): BrandedInt8 {
	return arith.plus(from(a), from(b));
}

export function minus(a: Int8Input, b: Int8Input): BrandedInt8 {
	return arith.minus(from(a), from(b));
}

export function times(a: Int8Input, b: Int8Input): BrandedInt8 {
	return arith.times(from(a), from(b));
}

export function dividedBy(a: Int8Input, b: Int8Input): BrandedInt8 {
	return arith.dividedBy(from(a), from(b));
}

export function modulo(a: Int8Input, b: Int8Input): BrandedInt8 {
	return arith.modulo(from(a), from(b));
}

export function abs(value: Int8Input): BrandedInt8 {
	return arith.abs(from(value));
}

export function negate(value: Int8Input): BrandedInt8 {
	return arith.negate(from(value));
}

export function equals(a: Int8Input, b: Int8Input): boolean {
	return cmp.equals(from(a), from(b));
}

export function lessThan(a: Int8Input, b: Int8Input): boolean {
	return cmp.lessThan(from(a), from(b));
}

export function greaterThan(a: Int8Input, b: Int8Input): boolean {
	return cmp.greaterThan(from(a), from(b));
}

export function isZero(value: Int8Input): boolean {
	return cmp.isZero(from(value));
}

export function isNegative(value: Int8Input): boolean {
	return cmp.isNegative(from(value));
}

export function isPositive(value: Int8Input): boolean {
	return cmp.isPositive(from(value));
}

export function minimum(a: Int8Input, b: Int8Input): BrandedInt8 {
	return cmp.minimum(from(a), from(b));
}

export function maximum(a: Int8Input, b: Int8Input): BrandedInt8 {
	return cmp.maximum(from(a), from(b));
}

export function sign(value: Int8Input): -1 | 0 | 1 {
	return cmp.sign(from(value));
}

export function and(a: Int8Input, b: Int8Input): BrandedInt8 {
	return bit.and(from(a), from(b));
}

export function or(a: Int8Input, b: Int8Input): BrandedInt8 {
	return bit.or(from(a), from(b));
}

export function xor(a: Int8Input, b: Int8Input): BrandedInt8 {
	return bit.xor(from(a), from(b));
}

export function not(value: Int8Input): BrandedInt8 {
	return bit.not(from(value));
}

export function shiftLeft(value: Int8Input, shift: number): BrandedInt8 {
	return bit.shiftLeft(from(value), shift);
}

export function shiftRight(value: Int8Input, shift: number): BrandedInt8 {
	return bit.shiftRight(from(value), shift);
}

export function bitLength(value: Int8Input): number {
	return util.bitLength(from(value));
}

export function leadingZeros(value: Int8Input): number {
	return util.leadingZeros(from(value));
}

export function popCount(value: Int8Input): number {
	return util.popCount(from(value));
}
