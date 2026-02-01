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
export type { BrandedInt16 } from "./Int16Type.js";
export { INT16_MAX, INT16_MIN } from "./Int16Type.js";

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
import type { BrandedInt16 } from "./Int16Type.js";
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

// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional wrapper for branded type
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
