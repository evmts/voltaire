export type { BrandedInt8 } from "./BrandedInt8.ts";
export { INT8_MIN, INT8_MAX } from "./BrandedInt8.ts";

// Constructors - no wrapper needed
export { from, fromNumber, fromBigint, fromHex, fromBytes } from "./from.js";

// Conversions - internal API (no conversion needed)
export {
	toNumber as _toNumber,
	toBigint as _toBigint,
	toHex as _toHex,
	toBytes as _toBytes,
	toString as _toString,
} from "./conversions.js";

// Arithmetic - internal API
export {
	plus as _plus,
	minus as _minus,
	times as _times,
	dividedBy as _dividedBy,
	modulo as _modulo,
	abs as _abs,
	negate as _negate,
} from "./arithmetic.js";

// Comparison - internal API
export {
	equals as _equals,
	lessThan as _lessThan,
	greaterThan as _greaterThan,
	isZero as _isZero,
	isNegative as _isNegative,
	isPositive as _isPositive,
	minimum as _minimum,
	maximum as _maximum,
	sign as _sign,
} from "./comparison.js";

// Bitwise - internal API
export {
	and as _and,
	or as _or,
	xor as _xor,
	not as _not,
	shiftLeft as _shiftLeft,
	shiftRight as _shiftRight,
} from "./bitwise.js";

// Utilities - internal API
export {
	bitLength as _bitLength,
	leadingZeros as _leadingZeros,
	popCount as _popCount,
	isValid,
} from "./utilities.js";

// Public wrappers (auto-convert inputs)
import type { BrandedInt8 } from "./BrandedInt8.ts";
import * as arith from "./arithmetic.js";
import * as bit from "./bitwise.js";
import * as cmp from "./comparison.js";
import * as conv from "./conversions.js";
import {
	fromBigint as _fromBigint,
	fromBytes as _fromBytes,
	fromHex as _fromHex,
	fromNumber as _fromNumber,
	from,
} from "./from.js";
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
