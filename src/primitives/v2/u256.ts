/**
 * U256 (256-bit Unsigned Integer) Types and Operations
 *
 * Complete U256 implementation with type safety and arithmetic operations.
 * All types and operations namespaced under U256 for intuitive access.
 *
 * @example
 * ```typescript
 * import { U256 } from './u256.js';
 *
 * // Create values
 * const a = U256.from(100n);
 * const b = U256.fromHex("0xff");
 *
 * // Arithmetic operations
 * const sum = U256.add(a, b);
 * const diff = U256.sub(a, b);
 *
 * // Conversions
 * const hex = U256.toHex(sum);
 * const bytes = U256.toBytes(sum);
 *
 * // Convenience API with this:
 * const result = U256.add.call(a, b);
 * ```
 */

// ============================================================================
// Main U256 Namespace
// ============================================================================

export namespace U256 {
  // ==========================================================================
  // Core Type
  // ==========================================================================

  const u256Symbol = Symbol("U256");

  /**
   * 256-bit unsigned integer type
   * Using bigint as underlying representation
   */
  export type Type = bigint & { __brand: typeof u256Symbol };

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * Maximum U256 value: 2^256 - 1
   */
  export const MAX: Type = ((1n << 256n) - 1n) as Type;

  /**
   * Minimum U256 value: 0
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

  // ==========================================================================
  // Construction Operations
  // ==========================================================================

  /**
   * Create U256 from bigint or string (standard form)
   *
   * @param value - bigint or decimal/hex string
   * @returns U256 value
   * @throws Error if value is out of range or invalid
   *
   * @example
   * ```typescript
   * const a = U256.from(100n);
   * const b = U256.from("255");
   * const c = U256.from("0xff");
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
        throw new Error(`U256 value must be an integer: ${value}`);
      }
      bigintValue = BigInt(value);
    } else {
      bigintValue = value;
    }

    if (bigintValue < 0n) {
      throw new Error(`U256 value cannot be negative: ${bigintValue}`);
    }

    if (bigintValue > MAX) {
      throw new Error(`U256 value exceeds maximum: ${bigintValue}`);
    }

    return bigintValue as Type;
  }

  /**
   * Create U256 from hex string (standard form)
   *
   * @param hex - Hex string with or without 0x prefix
   * @returns U256 value
   * @throws Error if hex is invalid or value out of range
   *
   * @example
   * ```typescript
   * const a = U256.fromHex("0xff");
   * const b = U256.fromHex("ff");
   * ```
   */
  export function fromHex(hex: string): Type {
    const normalized = hex.startsWith("0x") ? hex : `0x${hex}`;
    const value = BigInt(normalized);

    if (value < 0n) {
      throw new Error(`U256 value cannot be negative: ${value}`);
    }

    if (value > MAX) {
      throw new Error(`U256 value exceeds maximum: ${value}`);
    }

    return value as Type;
  }

  /**
   * Create U256 from hex string (convenience form with this:)
   *
   * @param this - Hex string to convert
   * @returns U256 value
   *
   * @example
   * ```typescript
   * const value = U256.ofHex.call("0xff");
   * ```
   */
  export function ofHex(this: string): Type {
    return fromHex(this);
  }

  /**
   * Create U256 from bigint (standard form)
   *
   * @param value - bigint value
   * @returns U256 value
   * @throws Error if value out of range
   *
   * @example
   * ```typescript
   * const a = U256.fromBigInt(100n);
   * ```
   */
  export function fromBigInt(value: bigint): Type {
    if (value < 0n) {
      throw new Error(`U256 value cannot be negative: ${value}`);
    }

    if (value > MAX) {
      throw new Error(`U256 value exceeds maximum: ${value}`);
    }

    return value as Type;
  }

  /**
   * Create U256 from bigint (convenience form with this:)
   *
   * @param this - bigint to convert
   * @returns U256 value
   *
   * @example
   * ```typescript
   * const value = U256.ofBigInt.call(100n);
   * ```
   */
  export function ofBigInt(this: bigint): Type {
    return fromBigInt(this);
  }

  /**
   * Create U256 from number (standard form)
   *
   * @param value - number value (must be integer)
   * @returns U256 value
   * @throws Error if value is not an integer or out of range
   *
   * @example
   * ```typescript
   * const a = U256.fromNumber(255);
   * ```
   */
  export function fromNumber(value: number): Type {
    if (!Number.isInteger(value)) {
      throw new Error(`U256 value must be an integer: ${value}`);
    }
    return from(value);
  }

  /**
   * Create U256 from number (convenience form with this:)
   *
   * @param this - number to convert
   * @returns U256 value
   *
   * @example
   * ```typescript
   * const value = U256.ofNumber.call(255);
   * ```
   */
  export function ofNumber(this: number): Type {
    return fromNumber(this);
  }

  /**
   * Create U256 from bytes (big-endian) (standard form)
   *
   * @param bytes - Uint8Array of up to 32 bytes
   * @returns U256 value
   * @throws Error if bytes length exceeds 32
   *
   * @example
   * ```typescript
   * const bytes = new Uint8Array([0xff, 0x00]);
   * const value = U256.fromBytes(bytes);
   * ```
   */
  export function fromBytes(bytes: Uint8Array): Type {
    if (bytes.length > 32) {
      throw new Error(`U256 bytes cannot exceed 32 bytes, got ${bytes.length}`);
    }

    let value = 0n;
    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8n) | BigInt(bytes[i]);
    }

    return value as Type;
  }

  /**
   * Create U256 from bytes (big-endian) (convenience form with this:)
   *
   * @param this - bytes to convert
   * @returns U256 value
   *
   * @example
   * ```typescript
   * const bytes = new Uint8Array([0xff, 0x00]);
   * const value = U256.ofBytes.call(bytes);
   * ```
   */
  export function ofBytes(this: Uint8Array): Type {
    return fromBytes(this);
  }

  /**
   * Try to create U256, returns undefined if invalid (standard form)
   *
   * @param value - bigint, number, or string
   * @returns U256 value or undefined
   *
   * @example
   * ```typescript
   * const a = U256.tryFrom(100n); // U256
   * const b = U256.tryFrom(-1n); // undefined
   * const c = U256.tryFrom("invalid"); // undefined
   * ```
   */
  export function tryFrom(value: bigint | number | string): Type | undefined {
    try {
      return from(value);
    } catch {
      return undefined;
    }
  }

  // ==========================================================================
  // Conversion Operations
  // ==========================================================================

  /**
   * Convert U256 to hex string (standard form)
   *
   * @param value - U256 value
   * @param padded - Whether to pad to 64 characters (32 bytes)
   * @returns Hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const hex = U256.toHex(U256.from(255)); // "0x00...ff"
   * const hex2 = U256.toHex(U256.from(255), false); // "0xff"
   * ```
   */
  export function toHex(value: Type, padded = true): string {
    const hex = (value as bigint).toString(16);
    return padded ? `0x${hex.padStart(64, "0")}` : `0x${hex}`;
  }

  /**
   * Convert U256 to hex string (convenience form with this:)
   *
   * @param this - U256 value to convert
   * @param padded - Whether to pad to 64 characters
   * @returns Hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const hex = U256.toHex.call(value);
   * ```
   */
  export function asHex(this: Type, padded = true): string {
    return toHex(this, padded);
  }

  /**
   * Convert U256 to bigint (standard form)
   *
   * @param value - U256 value
   * @returns bigint value
   *
   * @example
   * ```typescript
   * const bigint = U256.toBigInt(U256.from(255));
   * ```
   */
  export function toBigInt(value: Type): bigint {
    return value as bigint;
  }

  /**
   * Convert U256 to bigint (convenience form with this:)
   *
   * @param this - U256 value to convert
   * @returns bigint value
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const bigint = U256.toBigInt.call(value);
   * ```
   */
  export function asBigInt(this: Type): bigint {
    return toBigInt(this);
  }

  /**
   * Convert U256 to number (standard form)
   *
   * @param value - U256 value
   * @returns number value
   * @throws Error if value exceeds MAX_SAFE_INTEGER
   *
   * @example
   * ```typescript
   * const num = U256.toNumber(U256.from(255));
   * ```
   */
  export function toNumber(value: Type): number {
    const bigint = value as bigint;
    if (bigint > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`U256 value exceeds MAX_SAFE_INTEGER: ${bigint}`);
    }
    return Number(bigint);
  }

  /**
   * Convert U256 to number (convenience form with this:)
   *
   * @param this - U256 value to convert
   * @returns number value
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const num = U256.toNumber.call(value);
   * ```
   */
  export function asNumber(this: Type): number {
    return toNumber(this);
  }

  /**
   * Convert U256 to bytes (big-endian, 32 bytes) (standard form)
   *
   * @param value - U256 value
   * @returns 32-byte Uint8Array
   *
   * @example
   * ```typescript
   * const bytes = U256.toBytes(U256.from(255));
   * ```
   */
  export function toBytes(value: Type): Uint8Array {
    const bytes = new Uint8Array(32);
    let val = value as bigint;

    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(val & 0xffn);
      val = val >> 8n;
    }

    return bytes;
  }

  /**
   * Convert U256 to bytes (big-endian, 32 bytes) (convenience form with this:)
   *
   * @param this - U256 value to convert
   * @returns 32-byte Uint8Array
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const bytes = U256.toBytes.call(value);
   * ```
   */
  export function asBytes(this: Type): Uint8Array {
    return toBytes(this);
  }

  /**
   * Convert U256 to string representation (standard form)
   *
   * @param value - U256 value
   * @param radix - Base for string conversion (2, 10, 16, etc.)
   * @returns String representation
   *
   * @example
   * ```typescript
   * const dec = U256.toString(U256.from(255), 10); // "255"
   * const hex = U256.toString(U256.from(255), 16); // "ff"
   * const bin = U256.toString(U256.from(255), 2); // "11111111"
   * ```
   */
  export function toString(value: Type, radix: number = 10): string {
    return (value as bigint).toString(radix);
  }

  /**
   * Convert U256 to string representation (convenience form with this:)
   *
   * @param this - U256 value to convert
   * @param radix - Base for string conversion
   * @returns String representation
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const dec = U256.toString.call(value, 10);
   * ```
   */
  export function asString(this: Type, radix: number = 10): string {
    return toString(this, radix);
  }

  // ==========================================================================
  // Arithmetic Operations
  // ==========================================================================

  /**
   * Add two U256 values with wrapping (standard form)
   *
   * @param a - First operand
   * @param b - Second operand
   * @returns Sum (a + b) mod 2^256
   *
   * @example
   * ```typescript
   * const sum = U256.add(U256.from(100), U256.from(50)); // 150
   * const wrapped = U256.add(U256.MAX, U256.ONE); // 0 (wraps)
   * ```
   */
  export function add(a: Type, b: Type): Type {
    const sum = (a as bigint) + (b as bigint);
    return (sum & MAX) as Type;
  }

  /**
   * Add U256 value with wrapping (convenience form with this:)
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns Sum
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const sum = U256.add.call(a, U256.from(50));
   * ```
   */
  export function plus(this: Type, b: Type): Type {
    return add(this, b);
  }

  /**
   * Subtract two U256 values with wrapping (standard form)
   *
   * @param a - First operand
   * @param b - Second operand
   * @returns Difference (a - b) mod 2^256
   *
   * @example
   * ```typescript
   * const diff = U256.sub(U256.from(100), U256.from(50)); // 50
   * const wrapped = U256.sub(U256.ZERO, U256.ONE); // MAX (wraps)
   * ```
   */
  export function sub(a: Type, b: Type): Type {
    const diff = (a as bigint) - (b as bigint);
    if (diff < 0n) {
      return ((MAX as bigint) + 1n + diff) as Type;
    }
    return diff as Type;
  }

  /**
   * Subtract U256 value with wrapping (convenience form with this:)
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns Difference
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const diff = U256.sub.call(a, U256.from(50));
   * ```
   */
  export function minus(this: Type, b: Type): Type {
    return sub(this, b);
  }

  /**
   * Multiply two U256 values with wrapping (standard form)
   *
   * @param a - First operand
   * @param b - Second operand
   * @returns Product (a * b) mod 2^256
   *
   * @example
   * ```typescript
   * const product = U256.mul(U256.from(10), U256.from(5)); // 50
   * ```
   */
  export function mul(a: Type, b: Type): Type {
    const product = (a as bigint) * (b as bigint);
    return (product & MAX) as Type;
  }

  /**
   * Multiply U256 value with wrapping (convenience form with this:)
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns Product
   *
   * @example
   * ```typescript
   * const a = U256.from(10);
   * const product = U256.mul.call(a, U256.from(5));
   * ```
   */
  export function times(this: Type, b: Type): Type {
    return mul(this, b);
  }

  /**
   * Divide two U256 values (standard form)
   *
   * @param a - Dividend
   * @param b - Divisor
   * @returns Quotient (a / b), floor division
   * @throws Error if divisor is zero
   *
   * @example
   * ```typescript
   * const quotient = U256.div(U256.from(100), U256.from(10)); // 10
   * ```
   */
  export function div(a: Type, b: Type): Type {
    if ((b as bigint) === 0n) {
      throw new Error("Division by zero");
    }
    return ((a as bigint) / (b as bigint)) as Type;
  }

  /**
   * Divide U256 value (convenience form with this:)
   *
   * @param this - Dividend
   * @param b - Divisor
   * @returns Quotient
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const quotient = U256.div.call(a, U256.from(10));
   * ```
   */
  export function dividedBy(this: Type, b: Type): Type {
    return div(this, b);
  }

  /**
   * Modulo operation on two U256 values (standard form)
   *
   * @param a - Dividend
   * @param b - Divisor
   * @returns Remainder (a % b)
   * @throws Error if divisor is zero
   *
   * @example
   * ```typescript
   * const remainder = U256.mod(U256.from(100), U256.from(30)); // 10
   * ```
   */
  export function mod(a: Type, b: Type): Type {
    if ((b as bigint) === 0n) {
      throw new Error("Modulo by zero");
    }
    return ((a as bigint) % (b as bigint)) as Type;
  }

  /**
   * Modulo operation (convenience form with this:)
   *
   * @param this - Dividend
   * @param b - Divisor
   * @returns Remainder
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const remainder = U256.mod.call(a, U256.from(30));
   * ```
   */
  export function modulo(this: Type, b: Type): Type {
    return mod(this, b);
  }

  /**
   * Exponentiation (standard form)
   *
   * @param base - Base value
   * @param exponent - Exponent value
   * @returns base^exponent mod 2^256
   *
   * @example
   * ```typescript
   * const result = U256.pow(U256.from(2), U256.from(8)); // 256
   * ```
   */
  export function pow(base: Type, exponent: Type): Type {
    let result = 1n;
    let b = base as bigint;
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

  /**
   * Exponentiation (convenience form with this:)
   *
   * @param this - Base value
   * @param exponent - Exponent value
   * @returns this^exponent
   *
   * @example
   * ```typescript
   * const base = U256.from(2);
   * const result = U256.pow.call(base, U256.from(8));
   * ```
   */
  export function toPower(this: Type, exponent: Type): Type {
    return pow(this, exponent);
  }

  // ==========================================================================
  // Bitwise Operations
  // ==========================================================================

  /**
   * Bitwise AND (standard form)
   *
   * @param a - First operand
   * @param b - Second operand
   * @returns a & b
   *
   * @example
   * ```typescript
   * const result = U256.and(U256.from(0xff), U256.from(0x0f)); // 0x0f
   * ```
   */
  export function and(a: Type, b: Type): Type {
    return ((a as bigint) & (b as bigint)) as Type;
  }

  /**
   * Bitwise AND (convenience form with this:)
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns this & b
   *
   * @example
   * ```typescript
   * const a = U256.from(0xff);
   * const result = U256.and.call(a, U256.from(0x0f));
   * ```
   */
  export function bitwiseAnd(this: Type, b: Type): Type {
    return and(this, b);
  }

  /**
   * Bitwise OR (standard form)
   *
   * @param a - First operand
   * @param b - Second operand
   * @returns a | b
   *
   * @example
   * ```typescript
   * const result = U256.or(U256.from(0xf0), U256.from(0x0f)); // 0xff
   * ```
   */
  export function or(a: Type, b: Type): Type {
    return ((a as bigint) | (b as bigint)) as Type;
  }

  /**
   * Bitwise OR (convenience form with this:)
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns this | b
   *
   * @example
   * ```typescript
   * const a = U256.from(0xf0);
   * const result = U256.or.call(a, U256.from(0x0f));
   * ```
   */
  export function bitwiseOr(this: Type, b: Type): Type {
    return or(this, b);
  }

  /**
   * Bitwise XOR (standard form)
   *
   * @param a - First operand
   * @param b - Second operand
   * @returns a ^ b
   *
   * @example
   * ```typescript
   * const result = U256.xor(U256.from(0xff), U256.from(0x0f)); // 0xf0
   * ```
   */
  export function xor(a: Type, b: Type): Type {
    return ((a as bigint) ^ (b as bigint)) as Type;
  }

  /**
   * Bitwise XOR (convenience form with this:)
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns this ^ b
   *
   * @example
   * ```typescript
   * const a = U256.from(0xff);
   * const result = U256.xor.call(a, U256.from(0x0f));
   * ```
   */
  export function bitwiseXor(this: Type, b: Type): Type {
    return xor(this, b);
  }

  /**
   * Bitwise NOT (standard form)
   *
   * @param a - Operand
   * @returns ~a & MAX
   *
   * @example
   * ```typescript
   * const result = U256.not(U256.ZERO); // MAX
   * ```
   */
  export function not(a: Type): Type {
    return (~(a as bigint) & (MAX as bigint)) as Type;
  }

  /**
   * Bitwise NOT (convenience form with this:)
   *
   * @param this - Operand
   * @returns ~this
   *
   * @example
   * ```typescript
   * const a = U256.ZERO;
   * const result = U256.not.call(a);
   * ```
   */
  export function bitwiseNot(this: Type): Type {
    return not(this);
  }

  /**
   * Left shift (standard form)
   *
   * @param value - Value to shift
   * @param bits - Number of bits to shift
   * @returns value << bits (mod 2^256)
   *
   * @example
   * ```typescript
   * const result = U256.shl(U256.from(1), U256.from(8)); // 256
   * ```
   */
  export function shl(value: Type, bits: Type): Type {
    const shifted = (value as bigint) << (bits as bigint);
    return (shifted & (MAX as bigint)) as Type;
  }

  /**
   * Left shift (convenience form with this:)
   *
   * @param this - Value to shift
   * @param bits - Number of bits to shift
   * @returns this << bits
   *
   * @example
   * ```typescript
   * const a = U256.from(1);
   * const result = U256.shl.call(a, U256.from(8));
   * ```
   */
  export function shiftLeft(this: Type, bits: Type): Type {
    return shl(this, bits);
  }

  /**
   * Right shift (standard form)
   *
   * @param value - Value to shift
   * @param bits - Number of bits to shift
   * @returns value >> bits
   *
   * @example
   * ```typescript
   * const result = U256.shr(U256.from(256), U256.from(8)); // 1
   * ```
   */
  export function shr(value: Type, bits: Type): Type {
    return ((value as bigint) >> (bits as bigint)) as Type;
  }

  /**
   * Right shift (convenience form with this:)
   *
   * @param this - Value to shift
   * @param bits - Number of bits to shift
   * @returns this >> bits
   *
   * @example
   * ```typescript
   * const a = U256.from(256);
   * const result = U256.shr.call(a, U256.from(8));
   * ```
   */
  export function shiftRight(this: Type, bits: Type): Type {
    return shr(this, bits);
  }

  // ==========================================================================
  // Comparison Operations
  // ==========================================================================

  /**
   * Check equality (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns true if a === b
   *
   * @example
   * ```typescript
   * const isEqual = U256.eq(U256.from(100), U256.from(100)); // true
   * ```
   */
  export function eq(a: Type, b: Type): boolean {
    return (a as bigint) === (b as bigint);
  }

  /**
   * Check equality (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns true if this === b
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const isEqual = U256.eq.call(a, U256.from(100));
   * ```
   */
  export function equals(this: Type, b: Type): boolean {
    return eq(this, b);
  }

  /**
   * Check inequality (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns true if a !== b
   *
   * @example
   * ```typescript
   * const isNotEqual = U256.ne(U256.from(100), U256.from(200)); // true
   * ```
   */
  export function ne(a: Type, b: Type): boolean {
    return (a as bigint) !== (b as bigint);
  }

  /**
   * Check inequality (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns true if this !== b
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const isNotEqual = U256.ne.call(a, U256.from(200));
   * ```
   */
  export function notEquals(this: Type, b: Type): boolean {
    return ne(this, b);
  }

  /**
   * Check less than (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns true if a < b
   *
   * @example
   * ```typescript
   * const isLess = U256.lt(U256.from(100), U256.from(200)); // true
   * ```
   */
  export function lt(a: Type, b: Type): boolean {
    return (a as bigint) < (b as bigint);
  }

  /**
   * Check less than (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns true if this < b
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const isLess = U256.lt.call(a, U256.from(200));
   * ```
   */
  export function lessThan(this: Type, b: Type): boolean {
    return lt(this, b);
  }

  /**
   * Check less than or equal (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns true if a <= b
   *
   * @example
   * ```typescript
   * const isLessOrEqual = U256.lte(U256.from(100), U256.from(100)); // true
   * ```
   */
  export function lte(a: Type, b: Type): boolean {
    return (a as bigint) <= (b as bigint);
  }

  /**
   * Check less than or equal (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns true if this <= b
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const isLessOrEqual = U256.lte.call(a, U256.from(100));
   * ```
   */
  export function lessThanOrEqual(this: Type, b: Type): boolean {
    return lte(this, b);
  }

  /**
   * Check greater than (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns true if a > b
   *
   * @example
   * ```typescript
   * const isGreater = U256.gt(U256.from(200), U256.from(100)); // true
   * ```
   */
  export function gt(a: Type, b: Type): boolean {
    return (a as bigint) > (b as bigint);
  }

  /**
   * Check greater than (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns true if this > b
   *
   * @example
   * ```typescript
   * const a = U256.from(200);
   * const isGreater = U256.gt.call(a, U256.from(100));
   * ```
   */
  export function greaterThan(this: Type, b: Type): boolean {
    return gt(this, b);
  }

  /**
   * Check greater than or equal (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns true if a >= b
   *
   * @example
   * ```typescript
   * const isGreaterOrEqual = U256.gte(U256.from(100), U256.from(100)); // true
   * ```
   */
  export function gte(a: Type, b: Type): boolean {
    return (a as bigint) >= (b as bigint);
  }

  /**
   * Check greater than or equal (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns true if this >= b
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const isGreaterOrEqual = U256.gte.call(a, U256.from(100));
   * ```
   */
  export function greaterThanOrEqual(this: Type, b: Type): boolean {
    return gte(this, b);
  }

  /**
   * Check if value is zero (standard form)
   *
   * @param value - Value to check
   * @returns true if value === 0
   *
   * @example
   * ```typescript
   * const isZero = U256.isZero(U256.ZERO); // true
   * ```
   */
  export function isZero(value: Type): boolean {
    return (value as bigint) === 0n;
  }

  /**
   * Check if value is zero (convenience form with this:)
   *
   * @param this - Value to check
   * @returns true if this === 0
   *
   * @example
   * ```typescript
   * const a = U256.ZERO;
   * const isZero = U256.isZero.call(a);
   * ```
   */
  export function zero(this: Type): boolean {
    return isZero(this);
  }

  /**
   * Get minimum of two values (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns min(a, b)
   *
   * @example
   * ```typescript
   * const min = U256.min(U256.from(100), U256.from(200)); // 100
   * ```
   */
  export function min(a: Type, b: Type): Type {
    return (a as bigint) < (b as bigint) ? a : b;
  }

  /**
   * Get minimum of two values (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns min(this, b)
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const min = U256.min.call(a, U256.from(200));
   * ```
   */
  export function minimum(this: Type, b: Type): Type {
    return min(this, b);
  }

  /**
   * Get maximum of two values (standard form)
   *
   * @param a - First value
   * @param b - Second value
   * @returns max(a, b)
   *
   * @example
   * ```typescript
   * const max = U256.max(U256.from(100), U256.from(200)); // 200
   * ```
   */
  export function max(a: Type, b: Type): Type {
    return (a as bigint) > (b as bigint) ? a : b;
  }

  /**
   * Get maximum of two values (convenience form with this:)
   *
   * @param this - First value
   * @param b - Second value
   * @returns max(this, b)
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const max = U256.max.call(a, U256.from(200));
   * ```
   */
  export function maximum(this: Type, b: Type): Type {
    return max(this, b);
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Check if value is a valid U256 (standard form)
   *
   * @param value - Value to check
   * @returns true if value is valid U256
   *
   * @example
   * ```typescript
   * const isValid = U256.isValid(100n); // true
   * const isInvalid = U256.isValid(-1n); // false
   * ```
   */
  export function isValid(value: unknown): value is Type {
    if (typeof value !== "bigint") return false;
    return value >= 0n && value <= (MAX as bigint);
  }

  /**
   * Get number of bits required to represent value (standard form)
   *
   * @param value - Value to check
   * @returns Number of bits (0-256)
   *
   * @example
   * ```typescript
   * const bits = U256.bitLength(U256.from(255)); // 8
   * const bits2 = U256.bitLength(U256.from(256)); // 9
   * ```
   */
  export function bitLength(value: Type): number {
    if ((value as bigint) === 0n) return 0;
    return (value as bigint).toString(2).length;
  }

  /**
   * Get number of bits required to represent value (convenience form with this:)
   *
   * @param this - Value to check
   * @returns Number of bits
   *
   * @example
   * ```typescript
   * const a = U256.from(255);
   * const bits = U256.bitLength.call(a);
   * ```
   */
  export function bits(this: Type): number {
    return bitLength(this);
  }

  /**
   * Get number of leading zero bits (standard form)
   *
   * @param value - Value to check
   * @returns Number of leading zeros (0-256)
   *
   * @example
   * ```typescript
   * const zeros = U256.leadingZeros(U256.from(1)); // 255
   * ```
   */
  export function leadingZeros(value: Type): number {
    return 256 - bitLength(value);
  }

  /**
   * Get number of leading zero bits (convenience form with this:)
   *
   * @param this - Value to check
   * @returns Number of leading zeros
   *
   * @example
   * ```typescript
   * const a = U256.from(1);
   * const zeros = U256.leadingZeros.call(a);
   * ```
   */
  export function clz(this: Type): number {
    return leadingZeros(this);
  }

  /**
   * Count number of set bits (population count) (standard form)
   *
   * @param value - Value to check
   * @returns Number of 1 bits
   *
   * @example
   * ```typescript
   * const count = U256.popCount(U256.from(0xff)); // 8
   * ```
   */
  export function popCount(value: Type): number {
    let count = 0;
    let v = value as bigint;
    while (v > 0n) {
      count++;
      v = v & (v - 1n);
    }
    return count;
  }

  /**
   * Count number of set bits (convenience form with this:)
   *
   * @param this - Value to check
   * @returns Number of 1 bits
   *
   * @example
   * ```typescript
   * const a = U256.from(0xff);
   * const count = U256.popCount.call(a);
   * ```
   */
  export function countOnes(this: Type): number {
    return popCount(this);
  }
}

/**
 * U256 type alias for convenience
 *
 * Uses TypeScript declaration merging - U256 is both a namespace and a type.
 */
export type U256 = U256.Type;

// Re-export namespace as default
export default U256;
