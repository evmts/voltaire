/**
 * Hex (Hexadecimal) Types and Utilities
 *
 * Complete hex encoding/decoding with type safety.
 * All types namespaced under Hex for intuitive access.
 *
 * @example
 * ```typescript
 * import { Hex } from './hex.js';
 *
 * // Types
 * const hex: Hex = '0x1234';
 * const sized: Hex.Sized<4> = '0x12345678';
 *
 * // Operations - all use this: pattern
 * const bytes = Hex.toBytes.call(hex);
 * const newHex = Hex.fromBytes(bytes);
 * const size = Hex.size.call(hex);
 * ```
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Hex string with 0x prefix (unsized)
 */
export type Unsized = `0x${string}` & { readonly __tag: 'Hex' };

/**
 * Hex string with specific byte size
 * @example Hex.Sized<4> = '0x12345678' (4 bytes = 8 hex chars)
 */
export type Sized<TSize extends number = number> = `0x${string}` & {
	readonly __tag: 'Hex';
	readonly size: TSize;
};

/**
 * Hex string of exactly N bytes
 */
export type Bytes<N extends number> = Sized<N>;

/**
 * Hex string type (unsized)
 *
 * Uses TypeScript declaration merging - Hex is both a namespace and a type.
 */
export type Hex = Unsized;

// ============================================================================
// Exports
// ============================================================================

// Errors
export * from "./errors.js";

// Static/construction operations (no this: parameter)
export { fromBytes } from "./fromBytes.js";
export { fromNumber } from "./fromNumber.js";
export { fromBigInt } from "./fromBigInt.js";
export { fromString } from "./fromString.js";
export { fromBoolean } from "./fromBoolean.js";
export { isHex } from "./isHex.js";
export { concat } from "./concat.js";
export { random } from "./random.js";
export { zero } from "./zero.js";

// Internal methods (exported with _ prefix for .call() usage)
export { toBytes as _toBytes } from "./toBytes.js";
export { toNumber as _toNumber } from "./toNumber.js";
export { toBigInt as _toBigInt } from "./toBigInt.js";
export { toString as _toString } from "./toString.js";
export { toBoolean as _toBoolean } from "./toBoolean.js";
export { size as _size } from "./size.js";
export { isSized as _isSized } from "./isSized.js";
export { validate as _validate } from "./validate.js";
export { assertSize as _assertSize } from "./assertSize.js";
export { slice as _slice } from "./slice.js";
export { pad as _pad } from "./pad.js";
export { padRight as _padRight } from "./padRight.js";
export { trim as _trim } from "./trim.js";
export { equals as _equals } from "./equals.js";
export { xor as _xor } from "./xor.js";

// Import internal methods for wrapper usage
import { toBytes as toBytesInternal } from "./toBytes.js";
import { toNumber as toNumberInternal } from "./toNumber.js";
import { toBigInt as toBigIntInternal } from "./toBigInt.js";
import { toString as toStringInternal } from "./toString.js";
import { toBoolean as toBooleanInternal } from "./toBoolean.js";
import { size as sizeInternal } from "./size.js";
import { isSized as isSizedInternal } from "./isSized.js";
import { validate as validateInternal } from "./validate.js";
import { assertSize as assertSizeInternal } from "./assertSize.js";
import { slice as sliceInternal } from "./slice.js";
import { pad as padInternal } from "./pad.js";
import { padRight as padRightInternal } from "./padRight.js";
import { trim as trimInternal } from "./trim.js";
import { equals as equalsInternal } from "./equals.js";
import { xor as xorInternal } from "./xor.js";
import { fromBytes } from "./fromBytes.js";

// ============================================================================
// Convenience Constructor
// ============================================================================

/**
 * Create Hex from string or bytes
 *
 * @param value - Hex string or bytes
 * @returns Hex string
 *
 * @example
 * ```typescript
 * const hex = Hex.from('0x1234');
 * const hex2 = Hex.from(new Uint8Array([0x12, 0x34]));
 * ```
 */
export function from(value: string | Uint8Array): Unsized {
  if (typeof value === 'string') {
    return value as Unsized;
  }
  return fromBytes(value);
}

// ============================================================================
// Public Wrapper Functions (namespace+type overloading pattern)
// ============================================================================

/**
 * Convert Hex to bytes
 *
 * @param value - Hex string or bytes to convert
 * @returns Byte array
 *
 * @example
 * ```typescript
 * const bytes = Hex.toBytes('0x1234');
 * ```
 */
export function toBytes(value: string | Uint8Array): Uint8Array {
  return toBytesInternal.call(from(value));
}

/**
 * Convert Hex to number
 *
 * @param value - Hex string or bytes to convert
 * @returns Number value
 *
 * @example
 * ```typescript
 * const num = Hex.toNumber('0xff'); // 255
 * ```
 */
export function toNumber(value: string | Uint8Array): number {
  return toNumberInternal.call(from(value));
}

/**
 * Convert Hex to bigint
 *
 * @param value - Hex string or bytes to convert
 * @returns BigInt value
 *
 * @example
 * ```typescript
 * const big = Hex.toBigInt('0xffffffff');
 * ```
 */
export function toBigInt(value: string | Uint8Array): bigint {
  return toBigIntInternal.call(from(value));
}

/**
 * Convert Hex to string
 *
 * @param value - Hex string or bytes to convert
 * @returns String representation
 *
 * @example
 * ```typescript
 * const str = Hex.toString('0x48656c6c6f'); // "Hello"
 * ```
 */
export function toString(value: string | Uint8Array): string {
  return toStringInternal.call(from(value));
}

/**
 * Convert Hex to boolean
 *
 * @param value - Hex string or bytes to convert
 * @returns Boolean value
 *
 * @example
 * ```typescript
 * const bool = Hex.toBoolean('0x01'); // true
 * ```
 */
export function toBoolean(value: string | Uint8Array): boolean {
  return toBooleanInternal.call(from(value));
}

/**
 * Get size of hex in bytes
 *
 * @param value - Hex string or bytes
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const sz = Hex.size('0x1234'); // 2
 * ```
 */
export function size(value: string | Uint8Array): number {
  return sizeInternal.call(from(value));
}

/**
 * Check if hex has specific size
 *
 * @param value - Hex string or bytes
 * @param targetSize - Target size in bytes
 * @returns True if size matches
 *
 * @example
 * ```typescript
 * const is4 = Hex.isSized('0x1234', 2); // true
 * ```
 */
export function isSized(value: string | Uint8Array, targetSize: number): boolean {
  return isSizedInternal.call(from(value), targetSize);
}

/**
 * Validate hex string
 *
 * @param value - Hex string or bytes to validate
 * @returns The validated hex string
 *
 * @example
 * ```typescript
 * const validated = Hex.validate('0x1234');
 * ```
 */
export function validate(value: string | Uint8Array): Unsized {
  return validateInternal.call(from(value));
}

/**
 * Assert hex has specific size
 *
 * @param value - Hex string or bytes
 * @param targetSize - Expected size in bytes
 * @returns The hex string if valid
 *
 * @example
 * ```typescript
 * const hex = Hex.assertSize('0x1234', 2);
 * ```
 */
export function assertSize(value: string | Uint8Array, targetSize: number): Unsized {
  return assertSizeInternal.call(from(value), targetSize);
}

/**
 * Slice hex string
 *
 * @param value - Hex string or bytes to slice
 * @param start - Start byte index
 * @param end - End byte index (optional)
 * @returns Sliced hex string
 *
 * @example
 * ```typescript
 * const sliced = Hex.slice('0x123456', 1); // '0x3456'
 * ```
 */
export function slice(value: string | Uint8Array, start: number, end?: number): Unsized {
  return sliceInternal.call(from(value), start, end);
}

/**
 * Pad hex to target size (left-padded with zeros)
 *
 * @param value - Hex string or bytes to pad
 * @param targetSize - Target size in bytes
 * @returns Padded hex string
 *
 * @example
 * ```typescript
 * const padded = Hex.pad('0x1234', 4); // '0x00001234'
 * ```
 */
export function pad(value: string | Uint8Array, targetSize: number): Unsized {
  return padInternal.call(from(value), targetSize);
}

/**
 * Pad hex to target size (right-padded with zeros)
 *
 * @param value - Hex string or bytes to pad
 * @param targetSize - Target size in bytes
 * @returns Padded hex string
 *
 * @example
 * ```typescript
 * const padded = Hex.padRight('0x1234', 4); // '0x12340000'
 * ```
 */
export function padRight(value: string | Uint8Array, targetSize: number): Unsized {
  return padRightInternal.call(from(value), targetSize);
}

/**
 * Trim leading zeros from hex
 *
 * @param value - Hex string or bytes to trim
 * @returns Trimmed hex string
 *
 * @example
 * ```typescript
 * const trimmed = Hex.trim('0x00001234'); // '0x1234'
 * ```
 */
export function trim(value: string | Uint8Array): Unsized {
  return trimInternal.call(from(value));
}

/**
 * Check if two hex strings are equal
 *
 * @param value - First hex string or bytes
 * @param other - Second hex string
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const eq = Hex.equals('0x1234', '0x1234'); // true
 * ```
 */
export function equals(value: string | Uint8Array, other: Unsized): boolean {
  return equalsInternal.call(from(value), other);
}

/**
 * XOR two hex strings
 *
 * @param value - First hex string or bytes
 * @param other - Second hex string
 * @returns XOR result
 *
 * @example
 * ```typescript
 * const result = Hex.xor('0xff', '0x0f'); // '0xf0'
 * ```
 */
export function xor(value: string | Uint8Array, other: Unsized): Unsized {
  return xorInternal.call(from(value), other);
}
