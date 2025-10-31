/**
 * Uint (256-bit Unsigned Integer) Types and Operations
 *
 * Complete Uint256 implementation with type safety and arithmetic operations.
 * All types and operations namespaced under Uint for intuitive access.
 *
 * @example
 * ```typescript
 * import { Uint } from './uint.js';
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
// Main Uint Namespace
// ============================================================================

export namespace Uint {
  // ==========================================================================
  // Core Type
  // ==========================================================================

  const uintSymbol = Symbol("Uint256");

  /**
   * 256-bit unsigned integer type
   * Using bigint as underlying representation
   */
  export type Type = bigint & { __brand: typeof uintSymbol };

  // ==========================================================================
  // Constants
  // ==========================================================================

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

  // ==========================================================================
  // Construction Operations
  // ==========================================================================

  /**
   * Create Uint256 from bigint or string (standard form)
   *
   * @param value - bigint or decimal/hex string
   * @returns Uint256 value
   * @throws Error if value is out of range or invalid
   *
   * @example
   * ```typescript
   * const a = Uint.from(100n);
   * const b = Uint.from("255");
   * const c = Uint.from("0xff");
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
   * const value = Uint.fromHex.call("0xff");
   * const value2 = Uint.fromHex.call("ff");
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
   * const value = Uint.fromBigInt.call(100n);
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
   * const value = Uint.fromNumber.call(255);
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
   * const value = Uint.fromBytes.call(bytes);
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
   * const a = Uint.tryFrom(100n); // Uint256
   * const b = Uint.tryFrom(-1n); // undefined
   * const c = Uint.tryFrom("invalid"); // undefined
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
   * Convert Uint256 to hex string
   *
   * @param this - Uint256 value to convert
   * @param padded - Whether to pad to 64 characters (32 bytes)
   * @returns Hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const value = Uint.from(255);
   * const hex = Uint.toHex.call(value); // "0x00...ff"
   * const hex2 = Uint.toHex.call(value, false); // "0xff"
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
   * const value = Uint.from(255);
   * const bigint = Uint.toBigInt.call(value);
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
   * const value = Uint.from(255);
   * const num = Uint.toNumber.call(value);
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
   * const value = Uint.from(255);
   * const bytes = Uint.toBytes.call(value);
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
   * Convert Uint256 to string representation
   *
   * @param this - Uint256 value to convert
   * @param radix - Base for string conversion (2, 10, 16, etc.)
   * @returns String representation
   *
   * @example
   * ```typescript
   * const value = Uint.from(255);
   * const dec = Uint.toString.call(value, 10); // "255"
   * const hex = Uint.toString.call(value, 16); // "ff"
   * const bin = Uint.toString.call(value, 2); // "11111111"
   * ```
   */
  export function toString(this: Type, radix: number = 10): string {
    return (this as bigint).toString(radix);
  }

  // ==========================================================================
  // Arithmetic Operations
  // ==========================================================================

  /**
   * Add Uint256 value with wrapping
   *
   * @param this - First operand
   * @param b - Second operand
   * @returns Sum (this + b) mod 2^256
   *
   * @example
   * ```typescript
   * const a = Uint.from(100);
   * const sum = Uint.plus.call(a, Uint.from(50)); // 150
   * const wrapped = Uint.plus.call(Uint.MAX, Uint.ONE); // 0 (wraps)
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
   * const a = Uint.from(100);
   * const diff = Uint.minus.call(a, Uint.from(50)); // 50
   * const wrapped = Uint.minus.call(Uint.ZERO, Uint.ONE); // MAX (wraps)
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
   * const a = Uint.from(10);
   * const product = Uint.times.call(a, Uint.from(5)); // 50
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
   * const a = Uint.from(100);
   * const quotient = Uint.dividedBy.call(a, Uint.from(10)); // 10
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
   * const a = Uint.from(100);
   * const remainder = Uint.modulo.call(a, Uint.from(30)); // 10
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
   * const base = Uint.from(2);
   * const result = Uint.toPower.call(base, Uint.from(8)); // 256
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
   * const a = Uint.from(0xff);
   * const result = Uint.bitwiseAnd.call(a, Uint.from(0x0f)); // 0x0f
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
   * const a = Uint.from(0xf0);
   * const result = Uint.bitwiseOr.call(a, Uint.from(0x0f)); // 0xff
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
   * const a = Uint.from(0xff);
   * const result = Uint.bitwiseXor.call(a, Uint.from(0x0f)); // 0xf0
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
   * const a = Uint.ZERO;
   * const result = Uint.bitwiseNot.call(a); // MAX
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
   * const a = Uint.from(1);
   * const result = Uint.shiftLeft.call(a, Uint.from(8)); // 256
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
   * const a = Uint.from(256);
   * const result = Uint.shiftRight.call(a, Uint.from(8)); // 1
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
   * const a = Uint.from(100);
   * const isEqual = Uint.equals.call(a, Uint.from(100)); // true
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
   * const a = Uint.from(100);
   * const isNotEqual = Uint.notEquals.call(a, Uint.from(200)); // true
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
   * const a = Uint.from(100);
   * const isLess = Uint.lessThan.call(a, Uint.from(200)); // true
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
   * const a = Uint.from(100);
   * const isLessOrEqual = Uint.lessThanOrEqual.call(a, Uint.from(100)); // true
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
   * const a = Uint.from(200);
   * const isGreater = Uint.greaterThan.call(a, Uint.from(100)); // true
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
   * const a = Uint.from(100);
   * const isGreaterOrEqual = Uint.greaterThanOrEqual.call(a, Uint.from(100)); // true
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
   * const a = Uint.ZERO;
   * const isZero = Uint.isZero.call(a); // true
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
   * const a = Uint.from(100);
   * const min = Uint.minimum.call(a, Uint.from(200)); // 100
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
   * const a = Uint.from(100);
   * const max = Uint.maximum.call(a, Uint.from(200)); // 200
   * ```
   */
  export function maximum(this: Type, b: Type): Type {
    return (this as bigint) > (b as bigint) ? this : b;
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Check if value is a valid Uint256
   *
   * @param value - Value to check
   * @returns true if value is valid Uint256
   *
   * @example
   * ```typescript
   * const isValid = Uint.isValid(100n); // true
   * const isInvalid = Uint.isValid(-1n); // false
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
   * const a = Uint.from(255);
   * const bits = Uint.bitLength.call(a); // 8
   * const bits2 = Uint.bitLength.call(Uint.from(256)); // 9
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
   * const a = Uint.from(1);
   * const zeros = Uint.leadingZeros.call(a); // 255
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
   * const a = Uint.from(0xff);
   * const count = Uint.popCount.call(a); // 8
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
 * Uint type alias for convenience
 *
 * Uses TypeScript declaration merging - Uint is both a namespace and a type.
 */
export type Uint = Uint.Type;

// Re-export namespace as default
export default Uint;
