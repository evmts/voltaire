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
 * const sum = U256.plus.call(a, b);
 * const diff = U256.minus.call(a, b);
 *
 * // Conversions
 * const hex = U256.toHex.call(sum);
 * const bytes = U256.toBytes.call(sum);
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
   * Create U256 from hex string
   *
   * @param this - Hex string to convert
   * @returns U256 value
   * @throws Error if hex is invalid or value out of range
   *
   * @example
   * ```typescript
   * const value = U256.fromHex.call("0xff");
   * const value2 = U256.fromHex.call("ff");
   * ```
   */
  export function fromHex(this: string): Type {
    const normalized = this.startsWith("0x") ? this : `0x${this}`;
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
   * Create U256 from bigint
   *
   * @param this - bigint to convert
   * @returns U256 value
   * @throws Error if value out of range
   *
   * @example
   * ```typescript
   * const value = U256.fromBigInt.call(100n);
   * ```
   */
  export function fromBigInt(this: bigint): Type {
    if (this < 0n) {
      throw new Error(`U256 value cannot be negative: ${this}`);
    }

    if (this > MAX) {
      throw new Error(`U256 value exceeds maximum: ${this}`);
    }

    return this as Type;
  }

  /**
   * Create U256 from number
   *
   * @param this - number to convert
   * @returns U256 value
   * @throws Error if value is not an integer or out of range
   *
   * @example
   * ```typescript
   * const value = U256.fromNumber.call(255);
   * ```
   */
  export function fromNumber(this: number): Type {
    if (!Number.isInteger(this)) {
      throw new Error(`U256 value must be an integer: ${this}`);
    }
    return from(this);
  }

  /**
   * Create U256 from bytes (big-endian)
   *
   * @param this - bytes to convert
   * @returns U256 value
   * @throws Error if bytes length exceeds 32
   *
   * @example
   * ```typescript
   * const bytes = new Uint8Array([0xff, 0x00]);
   * const value = U256.fromBytes.call(bytes);
   * ```
   */
  export function fromBytes(this: Uint8Array): Type {
    if (this.length > 32) {
      throw new Error(`U256 bytes cannot exceed 32 bytes, got ${this.length}`);
    }

    let value = 0n;
    for (let i = 0; i < this.length; i++) {
      value = (value << 8n) | BigInt(this[i]);
    }

    return value as Type;
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
   * Convert U256 to hex string
   *
   * @param this - U256 value to convert
   * @param padded - Whether to pad to 64 characters (32 bytes)
   * @returns Hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const hex = U256.toHex.call(value); // "0x00...ff"
   * const hex2 = U256.toHex.call(value, false); // "0xff"
   * ```
   */
  export function toHex(this: Type, padded = true): string {
    const hex = (this as bigint).toString(16);
    return padded ? `0x${hex.padStart(64, "0")}` : `0x${hex}`;
  }

  /**
   * Convert U256 to bigint
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
  export function toBigInt(this: Type): bigint {
    return this as bigint;
  }

  /**
   * Convert U256 to number
   *
   * @param this - U256 value to convert
   * @returns number value
   * @throws Error if value exceeds MAX_SAFE_INTEGER
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const num = U256.toNumber.call(value);
   * ```
   */
  export function toNumber(this: Type): number {
    const bigint = this as bigint;
    if (bigint > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`U256 value exceeds MAX_SAFE_INTEGER: ${bigint}`);
    }
    return Number(bigint);
  }

  /**
   * Convert U256 to bytes (big-endian, 32 bytes)
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
   * Convert U256 to string representation
   *
   * @param this - U256 value to convert
   * @param radix - Base for string conversion (2, 10, 16, etc.)
   * @returns String representation
   *
   * @example
   * ```typescript
   * const value = U256.from(255);
   * const dec = U256.toString.call(value, 10); // "255"
   * const hex = U256.toString.call(value, 16); // "ff"
   * const bin = U256.toString.call(value, 2); // "11111111"
   * ```
   */
  export function toString(this: Type, radix: number = 10): string {
    return (this as bigint).toString(radix);
  }

  // ==========================================================================
  // Arithmetic Operations
  // ==========================================================================

  /**
   * Add U256 value with wrapping
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns Sum (this + b) mod 2^256
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const sum = U256.plus.call(a, U256.from(50)); // 150
   * const wrapped = U256.plus.call(U256.MAX, U256.ONE); // 0 (wraps)
   * ```
   */
  export function plus(this: Type, b: Type): Type {
    const sum = (this as bigint) + (b as bigint);
    return (sum & MAX) as Type;
  }

  /**
   * Subtract U256 value with wrapping
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns Difference (this - b) mod 2^256
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const diff = U256.minus.call(a, U256.from(50)); // 50
   * const wrapped = U256.minus.call(U256.ZERO, U256.ONE); // MAX (wraps)
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
   * Multiply U256 value with wrapping
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns Product (this * b) mod 2^256
   *
   * @example
   * ```typescript
   * const a = U256.from(10);
   * const product = U256.times.call(a, U256.from(5)); // 50
   * ```
   */
  export function times(this: Type, b: Type): Type {
    const product = (this as bigint) * (b as bigint);
    return (product & MAX) as Type;
  }

  /**
   * Divide U256 value
   *
   * @param this - Dividend
   * @param b - Divisor
   * @returns Quotient (this / b), floor division
   * @throws Error if divisor is zero
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const quotient = U256.dividedBy.call(a, U256.from(10)); // 10
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
   * const a = U256.from(100);
   * const remainder = U256.modulo.call(a, U256.from(30)); // 10
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
   * const base = U256.from(2);
   * const result = U256.toPower.call(base, U256.from(8)); // 256
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

  // ==========================================================================
  // Bitwise Operations
  // ==========================================================================

  /**
   * Bitwise AND
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns this & b
   *
   * @example
   * ```typescript
   * const a = U256.from(0xff);
   * const result = U256.bitwiseAnd.call(a, U256.from(0x0f)); // 0x0f
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
   * const a = U256.from(0xf0);
   * const result = U256.bitwiseOr.call(a, U256.from(0x0f)); // 0xff
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
   * const a = U256.from(0xff);
   * const result = U256.bitwiseXor.call(a, U256.from(0x0f)); // 0xf0
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
   * const a = U256.ZERO;
   * const result = U256.bitwiseNot.call(a); // MAX
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
   * const a = U256.from(1);
   * const result = U256.shiftLeft.call(a, U256.from(8)); // 256
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
   * const a = U256.from(256);
   * const result = U256.shiftRight.call(a, U256.from(8)); // 1
   * ```
   */
  export function shiftRight(this: Type, bits: Type): Type {
    return ((this as bigint) >> (bits as bigint)) as Type;
  }

  // ==========================================================================
  // Comparison Operations
  // ==========================================================================

  /**
   * Check equality
   *
   * @param this - First value
   * @param b - Second value
   * @returns true if this === b
   *
   * @example
   * ```typescript
   * const a = U256.from(100);
   * const isEqual = U256.equals.call(a, U256.from(100)); // true
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
   * const a = U256.from(100);
   * const isNotEqual = U256.notEquals.call(a, U256.from(200)); // true
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
   * const a = U256.from(100);
   * const isLess = U256.lessThan.call(a, U256.from(200)); // true
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
   * const a = U256.from(100);
   * const isLessOrEqual = U256.lessThanOrEqual.call(a, U256.from(100)); // true
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
   * const a = U256.from(200);
   * const isGreater = U256.greaterThan.call(a, U256.from(100)); // true
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
   * const a = U256.from(100);
   * const isGreaterOrEqual = U256.greaterThanOrEqual.call(a, U256.from(100)); // true
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
   * const a = U256.ZERO;
   * const isZero = U256.isZero.call(a); // true
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
   * const a = U256.from(100);
   * const min = U256.minimum.call(a, U256.from(200)); // 100
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
   * const a = U256.from(100);
   * const max = U256.maximum.call(a, U256.from(200)); // 200
   * ```
   */
  export function maximum(this: Type, b: Type): Type {
    return (this as bigint) > (b as bigint) ? this : b;
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Check if value is a valid U256
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
   * Get number of bits required to represent value
   *
   * @param this - Value to check
   * @returns Number of bits (0-256)
   *
   * @example
   * ```typescript
   * const a = U256.from(255);
   * const bits = U256.bitLength.call(a); // 8
   * const bits2 = U256.bitLength.call(U256.from(256)); // 9
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
   * const a = U256.from(1);
   * const zeros = U256.leadingZeros.call(a); // 255
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
   * const a = U256.from(0xff);
   * const count = U256.popCount.call(a); // 8
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
}

/**
 * U256 type alias for convenience
 *
 * Uses TypeScript declaration merging - U256 is both a namespace and a type.
 */
export type U256 = U256.Type;

// Re-export namespace as default
export default U256;
