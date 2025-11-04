/**
 * Uint (256-bit Unsigned Integer) Types and Operations
 *
 * Complete Uint256 implementation with type safety and arithmetic operations.
 *
 * @example
 * ```typescript
 * import * as Uint from './Uint.js';
 *
 * // Create values
 * const a = Uint.from(100n);
 * const b = Uint.fromHex.call("0xff");
 *
 * // Arithmetic operations
 * const sum = Uint.plus.call(a, b);
 * const diff = Uint.minus.call(a, b);
 *
 * // Conversions
 * const hex = Uint.toHex.call(sum);
 * const bytes = Uint.toBytes.call(sum);
 * ```
 */

// ============================================================================
// Core Type
// ============================================================================

const uintSymbol = Symbol("Uint256");

/**
 * 256-bit unsigned integer type
 * Using bigint as underlying representation
 */
export type Type = bigint & { __brand: typeof uintSymbol };

/**
 * Uint type alias for convenience
 */
export type Uint = Type;

// ============================================================================
// Exports
// ============================================================================

// Constants
export * from "./constants.js";

// Static/construction operations (no this: parameter)
export { from } from "./from.js";
export { fromHex as _fromHex } from "./fromHex.js";
export { fromBigInt as _fromBigInt } from "./fromBigInt.js";
export { fromNumber as _fromNumber } from "./fromNumber.js";
export { fromBytes as _fromBytes } from "./fromBytes.js";
export { fromAbiEncoded } from "./fromAbiEncoded.js";
export { tryFrom } from "./tryFrom.js";
export { isValid } from "./isValid.js";

// Internal methods (exported with _ prefix for .call() usage)
export { toHex as _toHex } from "./toHex.js";
export { toBigInt as _toBigInt } from "./toBigInt.js";
export { toNumber as _toNumber } from "./toNumber.js";
export { toBytes as _toBytes } from "./toBytes.js";
export { toAbiEncoded as _toAbiEncoded } from "./toAbiEncoded.js";
export { toString as _toString } from "./toString.js";
export { plus as _plus } from "./plus.js";
export { minus as _minus } from "./minus.js";
export { times as _times } from "./times.js";
export { dividedBy as _dividedBy } from "./dividedBy.js";
export { modulo as _modulo } from "./modulo.js";
export { toPower as _toPower } from "./toPower.js";
export { bitwiseAnd as _bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseOr as _bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor as _bitwiseXor } from "./bitwiseXor.js";
export { bitwiseNot as _bitwiseNot } from "./bitwiseNot.js";
export { shiftLeft as _shiftLeft } from "./shiftLeft.js";
export { shiftRight as _shiftRight } from "./shiftRight.js";
export { equals as _equals } from "./equals.js";
export { notEquals as _notEquals } from "./notEquals.js";
export { lessThan as _lessThan } from "./lessThan.js";
export { lessThanOrEqual as _lessThanOrEqual } from "./lessThanOrEqual.js";
export { greaterThan as _greaterThan } from "./greaterThan.js";
export { greaterThanOrEqual as _greaterThanOrEqual } from "./greaterThanOrEqual.js";
export { isZero as _isZero } from "./isZero.js";
export { minimum as _minimum } from "./minimum.js";
export { maximum as _maximum } from "./maximum.js";
export { bitLength as _bitLength } from "./bitLength.js";
export { leadingZeros as _leadingZeros } from "./leadingZeros.js";
export { popCount as _popCount } from "./popCount.js";

import { bitLength as bitLengthInternal } from "./bitLength.js";
import { bitwiseAnd as bitwiseAndInternal } from "./bitwiseAnd.js";
import { bitwiseNot as bitwiseNotInternal } from "./bitwiseNot.js";
import { bitwiseOr as bitwiseOrInternal } from "./bitwiseOr.js";
import { bitwiseXor as bitwiseXorInternal } from "./bitwiseXor.js";
import { dividedBy as dividedByInternal } from "./dividedBy.js";
import { equals as equalsInternal } from "./equals.js";
import { from } from "./from.js";
import { fromBigInt as fromBigIntInternal } from "./fromBigInt.js";
import { fromBytes as fromBytesInternal } from "./fromBytes.js";
// Import internal methods for wrapper usage
import { fromHex as fromHexInternal } from "./fromHex.js";
import { fromNumber as fromNumberInternal } from "./fromNumber.js";
import { greaterThan as greaterThanInternal } from "./greaterThan.js";
import { greaterThanOrEqual as greaterThanOrEqualInternal } from "./greaterThanOrEqual.js";
import { isZero as isZeroInternal } from "./isZero.js";
import { leadingZeros as leadingZerosInternal } from "./leadingZeros.js";
import { lessThan as lessThanInternal } from "./lessThan.js";
import { lessThanOrEqual as lessThanOrEqualInternal } from "./lessThanOrEqual.js";
import { maximum as maximumInternal } from "./maximum.js";
import { minimum as minimumInternal } from "./minimum.js";
import { minus as minusInternal } from "./minus.js";
import { modulo as moduloInternal } from "./modulo.js";
import { notEquals as notEqualsInternal } from "./notEquals.js";
import { plus as plusInternal } from "./plus.js";
import { popCount as popCountInternal } from "./popCount.js";
import { shiftLeft as shiftLeftInternal } from "./shiftLeft.js";
import { shiftRight as shiftRightInternal } from "./shiftRight.js";
import { times as timesInternal } from "./times.js";
import { toAbiEncoded as toAbiEncodedInternal } from "./toAbiEncoded.js";
import { toBigInt as toBigIntInternal } from "./toBigInt.js";
import { toBytes as toBytesInternal } from "./toBytes.js";
import { toHex as toHexInternal } from "./toHex.js";
import { toNumber as toNumberInternal } from "./toNumber.js";
import { toPower as toPowerInternal } from "./toPower.js";
import { toString as toStringInternal } from "./toString.js";

// ============================================================================
// Public Wrapper Functions (namespace+type overloading pattern)
// ============================================================================

/**
 * Create Uint256 from hex string
 *
 * @param hex - Hex string to convert
 * @returns Uint256 value
 * @throws Error if hex is invalid or value out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromHex("0xff");
 * const value2 = Uint.fromHex("ff");
 * ```
 */
export function fromHex(hex: string): Type {
	return fromHexInternal.call(hex);
}

/**
 * Create Uint256 from bigint
 *
 * @param value - bigint to convert
 * @returns Uint256 value
 * @throws Error if value out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value: bigint): Type {
	return fromBigIntInternal.call(value);
}

/**
 * Create Uint256 from number
 *
 * @param value - number to convert
 * @returns Uint256 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromNumber(255);
 * ```
 */
export function fromNumber(value: number): Type {
	return fromNumberInternal.call(value);
}

/**
 * Create Uint256 from bytes (big-endian)
 *
 * @param bytes - bytes to convert
 * @returns Uint256 value
 * @throws Error if bytes length exceeds 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0xff, 0x00]);
 * const value = Uint.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): Type {
	return fromBytesInternal.call(bytes);
}

/**
 * Convert Uint256 to hex string
 *
 * @param value - Value to convert to Uint256 first
 * @param padded - Whether to pad to 64 characters (32 bytes)
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Uint.toHex(255); // "0x00...ff"
 * const hex2 = Uint.toHex(255, false); // "0xff"
 * ```
 */
export function toHex(value: number | bigint | string, padded = true): string {
	return toHexInternal.call(from(value), padded);
}

/**
 * Convert Uint256 to bigint
 *
 * @param value - Value to convert to Uint256 first
 * @returns BigInt value
 *
 * @example
 * ```typescript
 * const big = Uint.toBigInt(100);
 * ```
 */
export function toBigInt(value: number | bigint | string): bigint {
	return toBigIntInternal.call(from(value));
}

/**
 * Convert Uint256 to number
 *
 * @param value - Value to convert to Uint256 first
 * @returns Number value
 *
 * @example
 * ```typescript
 * const num = Uint.toNumber(100n);
 * ```
 */
export function toNumber(value: number | bigint | string): number {
	return toNumberInternal.call(from(value));
}

/**
 * Convert Uint256 to bytes
 *
 * @param value - Value to convert to Uint256 first
 * @returns 32-byte array
 *
 * @example
 * ```typescript
 * const bytes = Uint.toBytes(255);
 * ```
 */
export function toBytes(value: number | bigint | string): Uint8Array {
	return toBytesInternal.call(from(value));
}

/**
 * Convert Uint256 to ABI-encoded bytes
 *
 * @param value - Value to convert to Uint256 first
 * @returns ABI-encoded 32-byte array
 *
 * @example
 * ```typescript
 * const encoded = Uint.toAbiEncoded(100);
 * ```
 */
export function toAbiEncoded(value: number | bigint | string): Uint8Array {
	return toAbiEncodedInternal.call(from(value));
}

/**
 * Convert Uint256 to string
 *
 * @param value - Value to convert to Uint256 first
 * @param radix - Base for string conversion (2, 10, 16, etc.)
 * @returns String representation
 *
 * @example
 * ```typescript
 * const str = Uint.toString(100n); // "100"
 * const hex = Uint.toString(255, 16); // "ff"
 * ```
 */
export function toString(value: number | bigint | string, radix = 10): string {
	return toStringInternal.call(from(value), radix);
}

/**
 * Add two Uint256 values with wrapping
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Sum (a + b) mod 2^256
 *
 * @example
 * ```typescript
 * const sum = Uint.plus(100, 50); // 150
 * ```
 */
export function plus(a: number | bigint | string, b: Type): Type {
	return plusInternal.call(from(a), b);
}

/**
 * Subtract Uint256 values with wrapping
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Difference (a - b) mod 2^256
 *
 * @example
 * ```typescript
 * const diff = Uint.minus(100, 50); // 50
 * ```
 */
export function minus(a: number | bigint | string, b: Type): Type {
	return minusInternal.call(from(a), b);
}

/**
 * Multiply Uint256 values with wrapping
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Product (a * b) mod 2^256
 *
 * @example
 * ```typescript
 * const product = Uint.times(100, 2); // 200
 * ```
 */
export function times(a: number | bigint | string, b: Type): Type {
	return timesInternal.call(from(a), b);
}

/**
 * Divide Uint256 values (integer division)
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient (a / b)
 *
 * @example
 * ```typescript
 * const quotient = Uint.dividedBy(100, Uint.from(2)); // 50
 * ```
 */
export function dividedBy(a: number | bigint | string, b: Type): Type {
	return dividedByInternal.call(from(a), b);
}

/**
 * Modulo operation
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Remainder (a % b)
 *
 * @example
 * ```typescript
 * const remainder = Uint.modulo(100, Uint.from(3)); // 1
 * ```
 */
export function modulo(a: number | bigint | string, b: Type): Type {
	return moduloInternal.call(from(a), b);
}

/**
 * Raise to power with wrapping
 *
 * @param a - Base
 * @param b - Exponent
 * @returns Result (a ** b) mod 2^256
 *
 * @example
 * ```typescript
 * const power = Uint.toPower(2, Uint.from(8)); // 256
 * ```
 */
export function toPower(a: number | bigint | string, b: Type): Type {
	return toPowerInternal.call(from(a), b);
}

/**
 * Bitwise AND
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Result (a & b)
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseAnd(0xff, Uint.from(0x0f)); // 0x0f
 * ```
 */
export function bitwiseAnd(a: number | bigint | string, b: Type): Type {
	return bitwiseAndInternal.call(from(a), b);
}

/**
 * Bitwise OR
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Result (a | b)
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseOr(0xff, Uint.from(0x0f)); // 0xff
 * ```
 */
export function bitwiseOr(a: number | bigint | string, b: Type): Type {
	return bitwiseOrInternal.call(from(a), b);
}

/**
 * Bitwise XOR
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Result (a ^ b)
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseXor(0xff, Uint.from(0x0f)); // 0xf0
 * ```
 */
export function bitwiseXor(a: number | bigint | string, b: Type): Type {
	return bitwiseXorInternal.call(from(a), b);
}

/**
 * Bitwise NOT
 *
 * @param value - Value to invert
 * @returns Result (~value)
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseNot(0); // MAX
 * ```
 */
export function bitwiseNot(value: number | bigint | string): Type {
	return bitwiseNotInternal.call(from(value));
}

/**
 * Left bit shift
 *
 * @param value - Value to shift
 * @param bits - Number of bits to shift
 * @returns Result (value << bits) mod 2^256
 *
 * @example
 * ```typescript
 * const result = Uint.shiftLeft(1, Uint.from(8)); // 256
 * ```
 */
export function shiftLeft(value: number | bigint | string, bits: Type): Type {
	return shiftLeftInternal.call(from(value), bits);
}

/**
 * Right bit shift
 *
 * @param value - Value to shift
 * @param bits - Number of bits to shift
 * @returns Result (value >> bits)
 *
 * @example
 * ```typescript
 * const result = Uint.shiftRight(256, Uint.from(8)); // 1
 * ```
 */
export function shiftRight(value: number | bigint | string, bits: Type): Type {
	return shiftRightInternal.call(from(value), bits);
}

/**
 * Check equality
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a === b
 *
 * @example
 * ```typescript
 * const isEqual = Uint.equals(100, Uint.from(100)); // true
 * ```
 */
export function equals(a: number | bigint | string, b: Type): boolean {
	return equalsInternal.call(from(a), b);
}

/**
 * Check inequality
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a !== b
 *
 * @example
 * ```typescript
 * const notEqual = Uint.notEquals(100, Uint.from(50)); // true
 * ```
 */
export function notEquals(a: number | bigint | string, b: Type): boolean {
	return notEqualsInternal.call(from(a), b);
}

/**
 * Less than comparison
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a < b
 *
 * @example
 * ```typescript
 * const less = Uint.lessThan(50, Uint.from(100)); // true
 * ```
 */
export function lessThan(a: number | bigint | string, b: Type): boolean {
	return lessThanInternal.call(from(a), b);
}

/**
 * Less than or equal comparison
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a <= b
 *
 * @example
 * ```typescript
 * const lessOrEq = Uint.lessThanOrEqual(100, Uint.from(100)); // true
 * ```
 */
export function lessThanOrEqual(a: number | bigint | string, b: Type): boolean {
	return lessThanOrEqualInternal.call(from(a), b);
}

/**
 * Greater than comparison
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a > b
 *
 * @example
 * ```typescript
 * const greater = Uint.greaterThan(100, Uint.from(50)); // true
 * ```
 */
export function greaterThan(a: number | bigint | string, b: Type): boolean {
	return greaterThanInternal.call(from(a), b);
}

/**
 * Greater than or equal comparison
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a >= b
 *
 * @example
 * ```typescript
 * const greaterOrEq = Uint.greaterThanOrEqual(100, Uint.from(100)); // true
 * ```
 */
export function greaterThanOrEqual(
	a: number | bigint | string,
	b: Type,
): boolean {
	return greaterThanOrEqualInternal.call(from(a), b);
}

/**
 * Check if value is zero
 *
 * @param value - Value to check
 * @returns true if value === 0
 *
 * @example
 * ```typescript
 * const zero = Uint.isZero(0); // true
 * ```
 */
export function isZero(value: number | bigint | string): boolean {
	return isZeroInternal.call(from(value));
}

/**
 * Get minimum of two values
 *
 * @param a - First value
 * @param b - Second value
 * @returns Minimum value
 *
 * @example
 * ```typescript
 * const min = Uint.minimum(100, Uint.from(50)); // 50
 * ```
 */
export function minimum(a: number | bigint | string, b: Type): Type {
	return minimumInternal.call(from(a), b);
}

/**
 * Get maximum of two values
 *
 * @param a - First value
 * @param b - Second value
 * @returns Maximum value
 *
 * @example
 * ```typescript
 * const max = Uint.maximum(100, Uint.from(50)); // 100
 * ```
 */
export function maximum(a: number | bigint | string, b: Type): Type {
	return maximumInternal.call(from(a), b);
}

/**
 * Get bit length
 *
 * @param value - Value to measure
 * @returns Number of bits needed to represent value
 *
 * @example
 * ```typescript
 * const bits = Uint.bitLength(255); // 8
 * ```
 */
export function bitLength(value: number | bigint | string): number {
	return bitLengthInternal.call(from(value));
}

/**
 * Count leading zeros
 *
 * @param value - Value to measure
 * @returns Number of leading zero bits
 *
 * @example
 * ```typescript
 * const zeros = Uint.leadingZeros(1); // 255
 * ```
 */
export function leadingZeros(value: number | bigint | string): number {
	return leadingZerosInternal.call(from(value));
}

/**
 * Count set bits (population count)
 *
 * @param value - Value to count
 * @returns Number of 1 bits
 *
 * @example
 * ```typescript
 * const count = Uint.popCount(0xff); // 8
 * ```
 */
export function popCount(value: number | bigint | string): number {
	return popCountInternal.call(from(value));
}
