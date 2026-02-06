/**
 * Uint (256-bit Unsigned Integer) Types and Operations
 *
 * Complete Uint256 implementation with type safety and arithmetic operations.
 *
 * @example
 * ```typescript
 * import * as Uint from './uint.js';
 *
 * // Create values
 * const a = Uint.from(100n);
 * const b = Uint.fromHex("0xff");
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

// ============================================================================
// Constants
// ============================================================================

/**
 * Size in bytes (32 bytes for Uint256)
 */
export const SIZE = 32;

/**
 * Maximum Uint256 value: 2^256 - 1
 */
export const MAX: Type = ((1n << 256n) - 1n) as Type;

/**
 * Minimum Uint256 value: 0
 */
export const MIN: Type = 0n as Type;

/**
 * Zero value
 */
export const ZERO: Type = 0n as Type;

/**
 * One value
 */
export const ONE: Type = 1n as Type;

// ============================================================================
// Construction Operations
// ============================================================================

/**
 * Create Uint256 from bigint or string (standard form)
 *
 * @param value - bigint or decimal/hex string
 * @returns Uint256 value
 * @throws Error if value is out of range or invalid
 *
 * @example
 * ```typescript
 * const a = from(100n);
 * const b = from("255");
 * const c = from("0xff");
 * ```
 */
export function from(value: bigint | number | string): Type {
  let bigintValue: bigint;

  if (typeof value === "string") {
    if (value.startsWith("0x") || value.startsWith("0X")) {
      bigintValue = BigInt(value);
    } else {
      bigintValue = BigInt(value);
    }
  } else if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error(`Uint256 value must be an integer: ${value}`);
    }
    bigintValue = BigInt(value);
  } else {
    bigintValue = value;
  }

  if (bigintValue < 0n) {
    throw new Error(`Uint256 value cannot be negative: ${bigintValue}`);
  }

  if (bigintValue > MAX) {
    throw new Error(`Uint256 value exceeds maximum: ${bigintValue}`);
  }

  return bigintValue as Type;
}

/**
 * Create Uint256 from hex string
 *
 * @param this - Hex string to convert
 * @returns Uint256 value
 * @throws Error if hex is invalid or value out of range
 *
 * @example
 * ```typescript
 * const value = fromHex.call("0xff");
 * const value2 = fromHex.call("ff");
 * ```
 */
export function fromHex(this: string): Type {
  const normalized = this.startsWith("0x") ? this : `0x${this}`;
  const value = BigInt(normalized);

  if (value < 0n) {
    throw new Error(`Uint256 value cannot be negative: ${value}`);
  }

  if (value > MAX) {
    throw new Error(`Uint256 value exceeds maximum: ${value}`);
  }

  return value as Type;
}

/**
 * Create Uint256 from bigint
 *
 * @param this - bigint to convert
 * @returns Uint256 value
 * @throws Error if value out of range
 *
 * @example
 * ```typescript
 * const value = fromBigInt.call(100n);
 * ```
 */
export function fromBigInt(this: bigint): Type {
  if (this < 0n) {
    throw new Error(`Uint256 value cannot be negative: ${this}`);
  }

  if (this > MAX) {
    throw new Error(`Uint256 value exceeds maximum: ${this}`);
  }

  return this as Type;
}

/**
 * Create Uint256 from number
 *
 * @param this - number to convert
 * @returns Uint256 value
 * @throws Error if value is not an integer or out of range
 *
 * @example
 * ```typescript
 * const value = fromNumber.call(255);
 * ```
 */
export function fromNumber(this: number): Type {
  if (!Number.isInteger(this)) {
    throw new Error(`Uint256 value must be an integer: ${this}`);
  }
  return from(this);
}

/**
 * Create Uint256 from bytes (big-endian)
 *
 * @param this - bytes to convert
 * @returns Uint256 value
 * @throws Error if bytes length exceeds 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0xff, 0x00]);
 * const value = fromBytes.call(bytes);
 * ```
 */
export function fromBytes(this: Uint8Array): Type {
  if (this.length > 32) {
    throw new Error(`Uint256 bytes cannot exceed 32 bytes, got ${this.length}`);
  }

  let value = 0n;
  for (let i = 0; i < this.length; i++) {
    value = (value << 8n) | BigInt(this[i] ?? 0);
  }

  return value as Type;
}

/**
 * Try to create Uint256, returns undefined if invalid (standard form)
 *
 * @param value - bigint, number, or string
 * @returns Uint256 value or undefined
 *
 * @example
 * ```typescript
 * const a = tryFrom(100n); // Uint256
 * const b = tryFrom(-1n); // undefined
 * const c = tryFrom("invalid"); // undefined
 * ```
 */
export function tryFrom(value: bigint | number | string): Type | undefined {
  try {
    return from(value);
  } catch {
    return undefined;
  }
}

// ============================================================================
// Conversion Operations
// ============================================================================

/**
 * Convert Uint256 to hex string
 *
 * @param this - Uint256 value to convert
 * @param padded - Whether to pad to 64 characters (32 bytes)
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const value = from(255);
 * const hex = toHex.call(value); // "0x00...ff"
 * const hex2 = toHex.call(value, false); // "0xff"
 * ```
 */
export function toHex(this: Type, padded = true): string {
  const hex = (this as bigint).toString(16);
  return padded ? `0x${hex.padStart(64, "0")}` : `0x${hex}`;
}

/**
 * Convert Uint256 to bigint
 *
 * @param this - Uint256 value to convert
 * @returns bigint value
 *
 * @example
 * ```typescript
 * const value = from(255);
 * const bigint = toBigInt.call(value);
 * ```
 */
export function toBigInt(this: Type): bigint {
  return this as bigint;
}

/**
 * Convert Uint256 to number
 *
 * @param this - Uint256 value to convert
 * @returns number value
 * @throws Error if value exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const value = from(255);
 * const num = toNumber.call(value);
 * ```
 */
export function toNumber(this: Type): number {
  const bigint = this as bigint;
  if (bigint > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Uint256 value exceeds MAX_SAFE_INTEGER: ${bigint}`);
  }
  return Number(bigint);
}

/**
 * Convert Uint256 to bytes (big-endian, 32 bytes)
 *
 * @param this - Uint256 value to convert
 * @returns 32-byte Uint8Array
 *
 * @example
 * ```typescript
 * const value = from(255);
 * const bytes = toBytes.call(value);
 * ```
 */
export function toBytes(this: Type): Uint8Array {
  const bytes = new Uint8Array(32);
  let val = this as bigint;

  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(val & 0xffn);
    val = val >> 8n;
  }

  return bytes;
}

/**
 * Convert Uint256 to ABI-encoded bytes (32 bytes, big-endian)
 *
 * This is identical to toBytes() - all Uint256 values in ABI encoding
 * are represented as 32-byte big-endian values.
 *
 * @param this - Uint256 value to encode
 * @returns 32-byte ABI-encoded Uint8Array
 *
 * @example
 * ```typescript
 * const value = from(255);
 * const encoded = toAbiEncoded.call(value);
 * ```
 */
export function toAbiEncoded(this: Type): Uint8Array {
  return toBytes.call(this);
}

/**
 * Decode Uint256 from ABI-encoded bytes (32 bytes, big-endian)
 *
 * @param bytes - 32-byte ABI-encoded data
 * @returns Decoded Uint256 value
 * @throws Error if bytes length is not 32
 *
 * @example
 * ```typescript
 * const encoded = new Uint8Array(32);
 * encoded[31] = 255;
 * const value = fromAbiEncoded(encoded); // 255n
 * ```
 */
export function fromAbiEncoded(bytes: Uint8Array): Type {
  if (bytes.length !== 32) {
    throw new Error(`ABI-encoded Uint256 must be exactly 32 bytes, got ${bytes.length}`);
  }
  return fromBytes.call(bytes);
}

/**
 * Convert Uint256 to string representation
 *
 * @param this - Uint256 value to convert
 * @param radix - Base for string conversion (2, 10, 16, etc.)
 * @returns String representation
 *
 * @example
 * ```typescript
 * const value = from(255);
 * const dec = toString.call(value, 10); // "255"
 * const hex = toString.call(value, 16); // "ff"
 * const bin = toString.call(value, 2); // "11111111"
 * ```
 */
export function toString(this: Type, radix: number = 10): string {
  return (this as bigint).toString(radix);
}

// ============================================================================
// Arithmetic Operations
// ============================================================================

/**
 * Add Uint256 value with wrapping
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns Sum (this + b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const sum = plus.call(a, from(50)); // 150
 * const wrapped = plus.call(MAX, ONE); // 0 (wraps)
 * ```
 */
export function plus(this: Type, b: Type): Type {
  const sum = (this as bigint) + (b as bigint);
  return (sum & MAX) as Type;
}

/**
 * Subtract Uint256 value with wrapping
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns Difference (this - b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const diff = minus.call(a, from(50)); // 50
 * const wrapped = minus.call(ZERO, ONE); // MAX (wraps)
 * ```
 */
export function minus(this: Type, b: Type): Type {
  const diff = (this as bigint) - (b as bigint);
  if (diff < 0n) {
    return ((MAX as bigint) + 1n + diff) as Type;
  }
  return diff as Type;
}

/**
 * Multiply Uint256 value with wrapping
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns Product (this * b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = from(10);
 * const product = times.call(a, from(5)); // 50
 * ```
 */
export function times(this: Type, b: Type): Type {
  const product = (this as bigint) * (b as bigint);
  return (product & MAX) as Type;
}

/**
 * Divide Uint256 value
 *
 * @param this - Dividend
 * @param b - Divisor
 * @returns Quotient (this / b), floor division
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const quotient = dividedBy.call(a, from(10)); // 10
 * ```
 */
export function dividedBy(this: Type, b: Type): Type {
  if ((b as bigint) === 0n) {
    throw new Error("Division by zero");
  }
  return ((this as bigint) / (b as bigint)) as Type;
}

/**
 * Modulo operation
 *
 * @param this - Dividend
 * @param b - Divisor
 * @returns Remainder (this % b)
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const remainder = modulo.call(a, from(30)); // 10
 * ```
 */
export function modulo(this: Type, b: Type): Type {
  if ((b as bigint) === 0n) {
    throw new Error("Modulo by zero");
  }
  return ((this as bigint) % (b as bigint)) as Type;
}

/**
 * Exponentiation
 *
 * @param this - Base value
 * @param exponent - Exponent value
 * @returns this^exponent mod 2^256
 *
 * @example
 * ```typescript
 * const base = from(2);
 * const result = toPower.call(base, from(8)); // 256
 * ```
 */
export function toPower(this: Type, exponent: Type): Type {
  let result = 1n;
  let b = this as bigint;
  let e = exponent as bigint;

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) & (MAX as bigint);
    }
    b = (b * b) & (MAX as bigint);
    e = e >> 1n;
  }

  return result as Type;
}

// ============================================================================
// Bitwise Operations
// ============================================================================

/**
 * Bitwise AND
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns this & b
 *
 * @example
 * ```typescript
 * const a = from(0xff);
 * const result = bitwiseAnd.call(a, from(0x0f)); // 0x0f
 * ```
 */
export function bitwiseAnd(this: Type, b: Type): Type {
  return ((this as bigint) & (b as bigint)) as Type;
}

/**
 * Bitwise OR
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns this | b
 *
 * @example
 * ```typescript
 * const a = from(0xf0);
 * const result = bitwiseOr.call(a, from(0x0f)); // 0xff
 * ```
 */
export function bitwiseOr(this: Type, b: Type): Type {
  return ((this as bigint) | (b as bigint)) as Type;
}

/**
 * Bitwise XOR
 *
 * @param this - First operand
 * @param b - Second operand
 * @returns this ^ b
 *
 * @example
 * ```typescript
 * const a = from(0xff);
 * const result = bitwiseXor.call(a, from(0x0f)); // 0xf0
 * ```
 */
export function bitwiseXor(this: Type, b: Type): Type {
  return ((this as bigint) ^ (b as bigint)) as Type;
}

/**
 * Bitwise NOT
 *
 * @param this - Operand
 * @returns ~this & MAX
 *
 * @example
 * ```typescript
 * const a = ZERO;
 * const result = bitwiseNot.call(a); // MAX
 * ```
 */
export function bitwiseNot(this: Type): Type {
  return (~(this as bigint) & (MAX as bigint)) as Type;
}

/**
 * Left shift
 *
 * @param this - Value to shift
 * @param bits - Number of bits to shift
 * @returns this << bits (mod 2^256)
 *
 * @example
 * ```typescript
 * const a = from(1);
 * const result = shiftLeft.call(a, from(8)); // 256
 * ```
 */
export function shiftLeft(this: Type, bits: Type): Type {
  const shifted = (this as bigint) << (bits as bigint);
  return (shifted & (MAX as bigint)) as Type;
}

/**
 * Right shift
 *
 * @param this - Value to shift
 * @param bits - Number of bits to shift
 * @returns this >> bits
 *
 * @example
 * ```typescript
 * const a = from(256);
 * const result = shiftRight.call(a, from(8)); // 1
 * ```
 */
export function shiftRight(this: Type, bits: Type): Type {
  return ((this as bigint) >> (bits as bigint)) as Type;
}

// ============================================================================
// Comparison Operations
// ============================================================================

/**
 * Check equality
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this === b
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const isEqual = equals.call(a, from(100)); // true
 * ```
 */
export function equals(this: Type, b: Type): boolean {
  return (this as bigint) === (b as bigint);
}

/**
 * Check inequality
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this !== b
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const isNotEqual = notEquals.call(a, from(200)); // true
 * ```
 */
export function notEquals(this: Type, b: Type): boolean {
  return (this as bigint) !== (b as bigint);
}

/**
 * Check less than
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this < b
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const isLess = lessThan.call(a, from(200)); // true
 * ```
 */
export function lessThan(this: Type, b: Type): boolean {
  return (this as bigint) < (b as bigint);
}

/**
 * Check less than or equal
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this <= b
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const isLessOrEqual = lessThanOrEqual.call(a, from(100)); // true
 * ```
 */
export function lessThanOrEqual(this: Type, b: Type): boolean {
  return (this as bigint) <= (b as bigint);
}

/**
 * Check greater than
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this > b
 *
 * @example
 * ```typescript
 * const a = from(200);
 * const isGreater = greaterThan.call(a, from(100)); // true
 * ```
 */
export function greaterThan(this: Type, b: Type): boolean {
  return (this as bigint) > (b as bigint);
}

/**
 * Check greater than or equal
 *
 * @param this - First value
 * @param b - Second value
 * @returns true if this >= b
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const isGreaterOrEqual = greaterThanOrEqual.call(a, from(100)); // true
 * ```
 */
export function greaterThanOrEqual(this: Type, b: Type): boolean {
  return (this as bigint) >= (b as bigint);
}

/**
 * Check if value is zero
 *
 * @param this - Value to check
 * @returns true if this === 0
 *
 * @example
 * ```typescript
 * const a = ZERO;
 * const isZero = isZero.call(a); // true
 * ```
 */
export function isZero(this: Type): boolean {
  return (this as bigint) === 0n;
}

/**
 * Get minimum of two values
 *
 * @param this - First value
 * @param b - Second value
 * @returns min(this, b)
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const min = minimum.call(a, from(200)); // 100
 * ```
 */
export function minimum(this: Type, b: Type): Type {
  return (this as bigint) < (b as bigint) ? this : b;
}

/**
 * Get maximum of two values
 *
 * @param this - First value
 * @param b - Second value
 * @returns max(this, b)
 *
 * @example
 * ```typescript
 * const a = from(100);
 * const max = maximum.call(a, from(200)); // 200
 * ```
 */
export function maximum(this: Type, b: Type): Type {
  return (this as bigint) > (b as bigint) ? this : b;
}

// ============================================================================
// Utility Operations
// ============================================================================

/**
 * Check if value is a valid Uint256
 *
 * @param value - Value to check
 * @returns true if value is valid Uint256
 *
 * @example
 * ```typescript
 * const isValid = isValid(100n); // true
 * const isInvalid = isValid(-1n); // false
 * ```
 */
export function isValid(value: unknown): value is Type {
  if (typeof value !== "bigint") return false;
  return value >= 0n && value <= (MAX as bigint);
}

/**
 * Get number of bits required to represent value
 *
 * @param this - Value to check
 * @returns Number of bits (0-256)
 *
 * @example
 * ```typescript
 * const a = from(255);
 * const bits = bitLength.call(a); // 8
 * const bits2 = bitLength.call(from(256)); // 9
 * ```
 */
export function bitLength(this: Type): number {
  if ((this as bigint) === 0n) return 0;
  return (this as bigint).toString(2).length;
}

/**
 * Get number of leading zero bits
 *
 * @param this - Value to check
 * @returns Number of leading zeros (0-256)
 *
 * @example
 * ```typescript
 * const a = from(1);
 * const zeros = leadingZeros.call(a); // 255
 * ```
 */
export function leadingZeros(this: Type): number {
  return 256 - bitLength.call(this);
}

/**
 * Count number of set bits (population count)
 *
 * @param this - Value to check
 * @returns Number of 1 bits
 *
 * @example
 * ```typescript
 * const a = from(0xff);
 * const count = popCount.call(a); // 8
 * ```
 */
export function popCount(this: Type): number {
  let count = 0;
  let v = this as bigint;
  while (v > 0n) {
    count++;
    v = v & (v - 1n);
  }
  return count;
}

// ============================================================================
// Type Alias
// ============================================================================

/**
 * Uint type alias for convenience
 */
export type Uint = Type;
