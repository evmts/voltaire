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
 * // Operations - standard form
 * const bytes = Hex.toBytes(hex);
 * const newHex = Hex.fromBytes(bytes);
 * const size = Hex.size(hex);
 *
 * // Operations - convenience form with this:
 * const bytes2 = Hex.asBytes.call(hex);
 * const size2 = Hex.getSize.call(hex);
 * ```
 */

// ============================================================================
// Main Hex Namespace
// ============================================================================

export namespace Hex {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * Hex string with 0x prefix (unsized)
   */
  export type Unsized = `0x${string}`;

  /**
   * Hex string with specific byte size
   * @example Hex.Sized<4> = '0x12345678' (4 bytes = 8 hex chars)
   */
  export type Sized<TSize extends number = number> = `0x${string}` & {
    readonly size: TSize;
  };

  /**
   * Hex string of exactly N bytes
   */
  export type Bytes<N extends number> = Sized<N>;

  // ==========================================================================
  // Error Types
  // ==========================================================================

  export class InvalidFormatError extends Error {
    constructor(message = "Invalid hex format: missing 0x prefix") {
      super(message);
      this.name = "InvalidHexFormatError";
    }
  }

  export class InvalidLengthError extends Error {
    constructor(message = "Invalid hex length") {
      super(message);
      this.name = "InvalidHexLengthError";
    }
  }

  export class InvalidCharacterError extends Error {
    constructor(message = "Invalid hex character") {
      super(message);
      this.name = "InvalidHexCharacterError";
    }
  }

  export class OddLengthError extends Error {
    constructor(message = "Odd length hex string") {
      super(message);
      this.name = "OddLengthHexError";
    }
  }

  // ==========================================================================
  // Internal Utilities
  // ==========================================================================

  /**
   * Convert hex character to numeric value
   * @internal
   */
  function hexCharToValue(c: string): number | null {
    const code = c.charCodeAt(0);
    if (code >= 48 && code <= 57) return code - 48; // 0-9
    if (code >= 97 && code <= 102) return code - 97 + 10; // a-f
    if (code >= 65 && code <= 70) return code - 65 + 10; // A-F
    return null;
  }

  // ==========================================================================
  // Validation Operations
  // ==========================================================================

  /**
   * Check if string is valid hex (standard form)
   *
   * @param value - String to validate
   * @returns True if valid hex format
   *
   * @example
   * ```typescript
   * Hex.isHex('0x1234'); // true
   * Hex.isHex('1234');   // false
   * Hex.isHex('0xZZZZ'); // false
   * ```
   */
  export function isHex(value: string): value is Unsized {
    if (value.length < 3 || !value.startsWith("0x")) return false;
    for (let i = 2; i < value.length; i++) {
      if (hexCharToValue(value[i]) === null) return false;
    }
    return true;
  }

  /**
   * Check if hex has specific byte size (standard form)
   *
   * @param hex - Hex string to check
   * @param size - Expected byte size
   * @returns True if hex matches size
   *
   * @example
   * ```typescript
   * Hex.isSized('0x1234', 2);     // true
   * Hex.isSized('0x123456', 2);   // false
   * ```
   */
  export function isSized<TSize extends number>(
    hex: Unsized,
    size: TSize,
  ): hex is Sized<TSize> {
    return (hex.length - 2) / 2 === size;
  }

  /**
   * Check if hex has specific byte size (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * Hex.hasSize.call(hex, 2); // true
   * ```
   */
  export function hasSize<TSize extends number>(
    this: Unsized,
    size: TSize,
  ): this is Sized<TSize> {
    return isSized(this, size);
  }

  /**
   * Validate hex string (standard form)
   *
   * @param value - String to validate
   * @returns Validated hex string
   * @throws {InvalidFormatError} If missing 0x prefix
   * @throws {InvalidCharacterError} If contains invalid hex characters
   *
   * @example
   * ```typescript
   * const hex = Hex.validate('0x1234'); // '0x1234'
   * Hex.validate('1234');  // throws InvalidFormatError
   * Hex.validate('0xZZZ'); // throws InvalidCharacterError
   * ```
   */
  export function validate(value: string): Unsized {
    if (value.length < 2 || !value.startsWith("0x")) throw new InvalidFormatError();
    for (let i = 2; i < value.length; i++) {
      if (hexCharToValue(value[i]) === null) throw new InvalidCharacterError();
    }
    return value as Unsized;
  }

  /**
   * Validate hex string (convenience form with this:)
   *
   * @example
   * ```typescript
   * const str = '0x1234';
   * const hex = Hex.asValidated.call(str); // validated Hex
   * ```
   */
  export function asValidated(this: string): Unsized {
    return validate(this);
  }

  /**
   * Assert hex has specific size (standard form)
   *
   * @param hex - Hex string to validate
   * @param size - Expected byte size
   * @returns Sized hex string
   * @throws {InvalidLengthError} If size doesn't match
   *
   * @example
   * ```typescript
   * const sized = Hex.assertSize('0x1234', 2); // Hex.Sized<2>
   * Hex.assertSize('0x1234', 4); // throws InvalidLengthError
   * ```
   */
  export function assertSize<TSize extends number>(
    hex: Unsized,
    size: TSize,
  ): Sized<TSize> {
    if (!isSized(hex, size)) {
      throw new InvalidLengthError(`Expected ${size} bytes, got ${(hex.length - 2) / 2}`);
    }
    return hex;
  }

  /**
   * Assert hex has specific size (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const sized = Hex.withSize.call(hex, 2); // Hex.Sized<2>
   * ```
   */
  export function withSize<TSize extends number>(
    this: Unsized,
    size: TSize,
  ): Sized<TSize> {
    return assertSize(this, size);
  }

  // ==========================================================================
  // Conversion Operations
  // ==========================================================================

  /**
   * Convert bytes to hex (standard form)
   *
   * @param bytes - Byte array to convert
   * @returns Hex string
   *
   * @example
   * ```typescript
   * const hex = Hex.fromBytes(new Uint8Array([0x12, 0x34])); // '0x1234'
   * ```
   */
  export function fromBytes(bytes: Uint8Array): Unsized {
    const hexChars = "0123456789abcdef";
    let result = "0x";
    for (let i = 0; i < bytes.length; i++) {
      result += hexChars[bytes[i] >> 4] + hexChars[bytes[i] & 0x0f];
    }
    return result as Unsized;
  }

  /**
   * Convert hex to bytes (standard form)
   *
   * @param hex - Hex string to convert
   * @returns Byte array
   * @throws {InvalidFormatError} If missing 0x prefix
   * @throws {OddLengthError} If hex has odd number of digits
   * @throws {InvalidCharacterError} If contains invalid hex characters
   *
   * @example
   * ```typescript
   * const bytes = Hex.toBytes('0x1234'); // Uint8Array([0x12, 0x34])
   * ```
   */
  export function toBytes(hex: Unsized): Uint8Array {
    if (!hex.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = hex.slice(2);
    if (hexDigits.length % 2 !== 0) throw new OddLengthError();
    const bytes = new Uint8Array(hexDigits.length / 2);
    for (let i = 0; i < hexDigits.length; i += 2) {
      const high = hexCharToValue(hexDigits[i]);
      const low = hexCharToValue(hexDigits[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytes[i / 2] = high * 16 + low;
    }
    return bytes;
  }

  /**
   * Convert hex to bytes (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const bytes = Hex.asBytes.call(hex); // Uint8Array([0x12, 0x34])
   * ```
   */
  export function asBytes(this: Unsized): Uint8Array {
    return toBytes(this);
  }

  /**
   * Convert number to hex (standard form)
   *
   * @param value - Number to convert
   * @param size - Optional byte size for padding
   * @returns Hex string
   *
   * @example
   * ```typescript
   * Hex.fromNumber(255);     // '0xff'
   * Hex.fromNumber(255, 2);  // '0x00ff'
   * Hex.fromNumber(0x1234);  // '0x1234'
   * ```
   */
  export function fromNumber(value: number, size?: number): Unsized {
    let hex = value.toString(16);
    if (size !== undefined) {
      hex = hex.padStart(size * 2, "0");
    }
    return `0x${hex}` as Unsized;
  }

  /**
   * Convert hex to number (standard form)
   *
   * @param hex - Hex string to convert
   * @returns Number value
   * @throws {RangeError} If hex represents value larger than MAX_SAFE_INTEGER
   *
   * @example
   * ```typescript
   * Hex.toNumber('0xff');   // 255
   * Hex.toNumber('0x1234'); // 4660
   * ```
   */
  export function toNumber(hex: Unsized): number {
    const num = parseInt(hex.slice(2), 16);
    if (!Number.isSafeInteger(num)) {
      throw new RangeError("Hex value exceeds MAX_SAFE_INTEGER");
    }
    return num;
  }

  /**
   * Convert hex to number (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0xff';
   * const num = Hex.asNumber.call(hex); // 255
   * ```
   */
  export function asNumber(this: Unsized): number {
    return toNumber(this);
  }

  /**
   * Convert bigint to hex (standard form)
   *
   * @param value - BigInt to convert
   * @param size - Optional byte size for padding
   * @returns Hex string
   *
   * @example
   * ```typescript
   * Hex.fromBigInt(255n);      // '0xff'
   * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
   * ```
   */
  export function fromBigInt(value: bigint, size?: number): Unsized {
    let hex = value.toString(16);
    if (size !== undefined) {
      hex = hex.padStart(size * 2, "0");
    }
    return `0x${hex}` as Unsized;
  }

  /**
   * Convert hex to bigint (standard form)
   *
   * @param hex - Hex string to convert
   * @returns BigInt value
   *
   * @example
   * ```typescript
   * Hex.toBigInt('0xff');   // 255n
   * Hex.toBigInt('0x1234'); // 4660n
   * ```
   */
  export function toBigInt(hex: Unsized): bigint {
    return BigInt(hex);
  }

  /**
   * Convert hex to bigint (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0xff';
   * const big = Hex.asBigInt.call(hex); // 255n
   * ```
   */
  export function asBigInt(this: Unsized): bigint {
    return toBigInt(this);
  }

  /**
   * Convert string to hex (standard form)
   *
   * @param str - String to convert
   * @param encoding - Text encoding (default: utf-8)
   * @returns Hex string
   *
   * @example
   * ```typescript
   * Hex.fromString('hello'); // '0x68656c6c6f'
   * ```
   */
  export function fromString(str: string): Unsized {
    const encoder = new TextEncoder();
    return fromBytes(encoder.encode(str));
  }

  /**
   * Convert hex to string (standard form)
   *
   * @param hex - Hex string to convert
   * @param encoding - Text encoding (default: utf-8)
   * @returns Decoded string
   *
   * @example
   * ```typescript
   * Hex.toString('0x68656c6c6f'); // 'hello'
   * ```
   */
  export function toString(hex: Unsized): string {
    const decoder = new TextDecoder();
    return decoder.decode(toBytes(hex));
  }

  /**
   * Convert hex to string (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x68656c6c6f';
   * const str = Hex.asString.call(hex); // 'hello'
   * ```
   */
  export function asString(this: Unsized): string {
    return toString(this);
  }

  /**
   * Convert boolean to hex (standard form)
   *
   * @param value - Boolean to convert
   * @returns Hex string ('0x01' for true, '0x00' for false)
   *
   * @example
   * ```typescript
   * Hex.fromBoolean(true);  // '0x01'
   * Hex.fromBoolean(false); // '0x00'
   * ```
   */
  export function fromBoolean(value: boolean): Sized<1> {
    return (value ? "0x01" : "0x00") as Sized<1>;
  }

  /**
   * Convert hex to boolean (standard form)
   *
   * @param hex - Hex string to convert
   * @returns Boolean value (true if non-zero, false if zero)
   *
   * @example
   * ```typescript
   * Hex.toBoolean('0x01'); // true
   * Hex.toBoolean('0x00'); // false
   * Hex.toBoolean('0xff'); // true
   * ```
   */
  export function toBoolean(hex: Unsized): boolean {
    const bytes = toBytes(hex);
    return bytes.some((b) => b !== 0);
  }

  /**
   * Convert hex to boolean (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x01';
   * const bool = Hex.asBoolean.call(hex); // true
   * ```
   */
  export function asBoolean(this: Unsized): boolean {
    return toBoolean(this);
  }

  // ==========================================================================
  // Size Operations
  // ==========================================================================

  /**
   * Get byte size of hex (standard form)
   *
   * @param hex - Hex string
   * @returns Size in bytes
   *
   * @example
   * ```typescript
   * Hex.size('0x1234');   // 2
   * Hex.size('0x123456'); // 3
   * ```
   */
  export function size(hex: Unsized): number {
    return (hex.length - 2) / 2;
  }

  /**
   * Get byte size of hex (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const s = Hex.getSize.call(hex); // 2
   * ```
   */
  export function getSize(this: Unsized): number {
    return size(this);
  }

  // ==========================================================================
  // Manipulation Operations
  // ==========================================================================

  /**
   * Concatenate multiple hex strings (standard form)
   *
   * @param hexes - Hex strings to concatenate
   * @returns Concatenated hex string
   *
   * @example
   * ```typescript
   * Hex.concat('0x12', '0x34', '0x56'); // '0x123456'
   * ```
   */
  export function concat(...hexes: Unsized[]): Unsized {
    return fromBytes(new Uint8Array(hexes.flatMap((h) => Array.from(toBytes(h)))));
  }

  /**
   * Slice hex string (standard form)
   *
   * @param hex - Hex string to slice
   * @param start - Start byte index
   * @param end - End byte index (optional)
   * @returns Sliced hex string
   *
   * @example
   * ```typescript
   * Hex.slice('0x123456', 1);    // '0x3456'
   * Hex.slice('0x123456', 0, 2); // '0x1234'
   * ```
   */
  export function slice(hex: Unsized, start: number, end?: number): Unsized {
    const bytes = toBytes(hex);
    return fromBytes(bytes.slice(start, end));
  }

  /**
   * Slice hex string (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x123456';
   * const sliced = Hex.getSlice.call(hex, 1); // '0x3456'
   * ```
   */
  export function getSlice(this: Unsized, start: number, end?: number): Unsized {
    return slice(this, start, end);
  }

  /**
   * Pad hex to target size (standard form)
   *
   * @param hex - Hex string to pad
   * @param targetSize - Target size in bytes
   * @returns Padded hex string (left-padded with zeros)
   *
   * @example
   * ```typescript
   * Hex.pad('0x1234', 4); // '0x00001234'
   * Hex.pad('0x1234', 2); // '0x1234' (no change if already >= target)
   * ```
   */
  export function pad(hex: Unsized, targetSize: number): Unsized {
    const bytes = toBytes(hex);
    if (bytes.length >= targetSize) return fromBytes(bytes);
    const padded = new Uint8Array(targetSize);
    padded.set(bytes, targetSize - bytes.length);
    return fromBytes(padded);
  }

  /**
   * Pad hex to target size (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const padded = Hex.getPadded.call(hex, 4); // '0x00001234'
   * ```
   */
  export function getPadded(this: Unsized, targetSize: number): Unsized {
    return pad(this, targetSize);
  }

  /**
   * Pad hex to right (suffix with zeros) (standard form)
   *
   * @param hex - Hex string to pad
   * @param targetSize - Target size in bytes
   * @returns Right-padded hex string
   *
   * @example
   * ```typescript
   * Hex.padRight('0x1234', 4); // '0x12340000'
   * ```
   */
  export function padRight(hex: Unsized, targetSize: number): Unsized {
    const bytes = toBytes(hex);
    if (bytes.length >= targetSize) return fromBytes(bytes);
    const padded = new Uint8Array(targetSize);
    padded.set(bytes, 0);
    return fromBytes(padded);
  }

  /**
   * Pad hex to right (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const padded = Hex.getRightPadded.call(hex, 4); // '0x12340000'
   * ```
   */
  export function getRightPadded(this: Unsized, targetSize: number): Unsized {
    return padRight(this, targetSize);
  }

  /**
   * Trim leading zeros from hex (standard form)
   *
   * @param hex - Hex string to trim
   * @returns Trimmed hex string
   *
   * @example
   * ```typescript
   * Hex.trim('0x00001234'); // '0x1234'
   * Hex.trim('0x00000000'); // '0x'
   * ```
   */
  export function trim(hex: Unsized): Unsized {
    const bytes = toBytes(hex);
    let start = 0;
    while (start < bytes.length && bytes[start] === 0) start++;
    return fromBytes(bytes.slice(start));
  }

  /**
   * Trim leading zeros from hex (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x00001234';
   * const trimmed = Hex.getTrimmed.call(hex); // '0x1234'
   * ```
   */
  export function getTrimmed(this: Unsized): Unsized {
    return trim(this);
  }

  // ==========================================================================
  // Comparison Operations
  // ==========================================================================

  /**
   * Check if two hex strings are equal (standard form)
   *
   * @param a - First hex string
   * @param b - Second hex string
   * @returns True if equal
   *
   * @example
   * ```typescript
   * Hex.equals('0x1234', '0x1234'); // true
   * Hex.equals('0x1234', '0x5678'); // false
   * ```
   */
  export function equals(a: Unsized, b: Unsized): boolean {
    return a.toLowerCase() === b.toLowerCase();
  }

  /**
   * Check if two hex strings are equal (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex1: Hex = '0x1234';
   * Hex.isEqual.call(hex1, '0x1234'); // true
   * ```
   */
  export function isEqual(this: Unsized, other: Unsized): boolean {
    return equals(this, other);
  }

  // ==========================================================================
  // Bitwise Operations
  // ==========================================================================

  /**
   * XOR two hex strings of same length (standard form)
   *
   * @param a - First hex string
   * @param b - Second hex string
   * @returns XOR result
   * @throws {InvalidLengthError} If lengths don't match
   *
   * @example
   * ```typescript
   * Hex.xor('0x12', '0x34'); // '0x26'
   * ```
   */
  export function xor(a: Unsized, b: Unsized): Unsized {
    const bytesA = toBytes(a);
    const bytesB = toBytes(b);
    if (bytesA.length !== bytesB.length) {
      throw new InvalidLengthError("Hex strings must have same length for XOR");
    }
    const result = new Uint8Array(bytesA.length);
    for (let i = 0; i < bytesA.length; i++) {
      result[i] = bytesA[i] ^ bytesB[i];
    }
    return fromBytes(result);
  }

  /**
   * XOR with another hex string (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hex1: Hex = '0x12';
   * const result = Hex.xorWith.call(hex1, '0x34'); // '0x26'
   * ```
   */
  export function xorWith(this: Unsized, other: Unsized): Unsized {
    return xor(this, other);
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Generate random hex of specific size (standard form)
   *
   * @param size - Size in bytes
   * @returns Random hex string
   *
   * @example
   * ```typescript
   * const random = Hex.random(32); // random 32-byte hex
   * ```
   */
  export function random(size: number): Unsized {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return fromBytes(bytes);
  }

  /**
   * Create zero-filled hex of specific size (standard form)
   *
   * @param size - Size in bytes
   * @returns Zero-filled hex string
   *
   * @example
   * ```typescript
   * Hex.zero(4); // '0x00000000'
   * ```
   */
  export function zero(size: number): Unsized {
    return fromBytes(new Uint8Array(size));
  }
}

/**
 * Hex string type (unsized)
 *
 * Uses TypeScript declaration merging - Hex is both a namespace and a type.
 */
export type Hex = Hex.Unsized;

// Re-export namespace as default
export default Hex;
