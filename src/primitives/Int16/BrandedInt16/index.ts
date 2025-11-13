export type { BrandedInt16 } from "./BrandedInt16.ts";
export { INT16_MIN, INT16_MAX } from "./BrandedInt16.ts";

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
import type { BrandedInt16 } from "./BrandedInt16.ts";
import {
	from,
	fromNumber as _fromNumber,
	fromBigint as _fromBigint,
	fromHex as _fromHex,
	fromBytes as _fromBytes,
} from "./from.js";
import * as conv from "./conversions.js";
import * as arith from "./arithmetic.js";
import * as cmp from "./comparison.js";
import * as bit from "./bitwise.js";
import * as util from "./utilities.js";

export type Int16Input = number | bigint | string | BrandedInt16;

export function toNumber(value: Int16Input): number {
	return conv.toNumber(from(value));
}

export function toBigint(value: Int16Input): bigint {
	return conv.toBigint(from(value));
}

export function toHex(value: Int16Input): string {
	return conv.toHex(from(value));
}

export function toBytes(value: Int16Input): Uint8Array {
	return conv.toBytes(from(value));
}

export function toString(value: Int16Input): string {
	return conv.toString(from(value));
}

export function plus(a: Int16Input, b: Int16Input): BrandedInt16 {
	return arith.plus(from(a), from(b));
}

export function minus(a: Int16Input, b: Int16Input): BrandedInt16 {
	return arith.minus(from(a), from(b));
}

export function times(a: Int16Input, b: Int16Input): BrandedInt16 {
	return arith.times(from(a), from(b));
}

export function dividedBy(a: Int16Input, b: Int16Input): BrandedInt16 {
	return arith.dividedBy(from(a), from(b));
}

export function modulo(a: Int16Input, b: Int16Input): BrandedInt16 {
	return arith.modulo(from(a), from(b));
}

export function abs(value: Int16Input): BrandedInt16 {
	return arith.abs(from(value));
}

export function negate(value: Int16Input): BrandedInt16 {
	return arith.negate(from(value));
}

export function equals(a: Int16Input, b: Int16Input): boolean {
	return cmp.equals(from(a), from(b));
}

export function lessThan(a: Int16Input, b: Int16Input): boolean {
	return cmp.lessThan(from(a), from(b));
}

export function greaterThan(a: Int16Input, b: Int16Input): boolean {
	return cmp.greaterThan(from(a), from(b));
}

export function isZero(value: Int16Input): boolean {
	return cmp.isZero(from(value));
}

export function isNegative(value: Int16Input): boolean {
	return cmp.isNegative(from(value));
}

export function isPositive(value: Int16Input): boolean {
	return cmp.isPositive(from(value));
}

export function minimum(a: Int16Input, b: Int16Input): BrandedInt16 {
	return cmp.minimum(from(a), from(b));
}

export function maximum(a: Int16Input, b: Int16Input): BrandedInt16 {
	return cmp.maximum(from(a), from(b));
}

export function sign(value: Int16Input): -1 | 0 | 1 {
	return cmp.sign(from(value));
}

export function and(a: Int16Input, b: Int16Input): BrandedInt16 {
	return bit.and(from(a), from(b));
}

export function or(a: Int16Input, b: Int16Input): BrandedInt16 {
	return bit.or(from(a), from(b));
}

export function xor(a: Int16Input, b: Int16Input): BrandedInt16 {
	return bit.xor(from(a), from(b));
}

export function not(value: Int16Input): BrandedInt16 {
	return bit.not(from(value));
}

export function shiftLeft(value: Int16Input, shift: number): BrandedInt16 {
	return bit.shiftLeft(from(value), shift);
}

export function shiftRight(value: Int16Input, shift: number): BrandedInt16 {
	return bit.shiftRight(from(value), shift);
}

export function bitLength(value: Int16Input): number {
	return util.bitLength(from(value));
}

export function leadingZeros(value: Int16Input): number {
	return util.leadingZeros(from(value));
}

export function popCount(value: Int16Input): number {
	return util.popCount(from(value));
}
