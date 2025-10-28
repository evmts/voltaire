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
   * Check if string is valid hex
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
   * Check if hex has specific byte size
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * Hex.isSized.call(hex, 2); // true
   * ```
   */
  export function isSized<TSize extends number>(
    this: Unsized,
    size: TSize,
  ): this is Sized<TSize> {
    return (this.length - 2) / 2 === size;
  }

  /**
   * Validate hex string
   *
   * @returns Validated hex string
   * @throws {InvalidFormatError} If missing 0x prefix
   * @throws {InvalidCharacterError} If contains invalid hex characters
   *
   * @example
   * ```typescript
   * const str = '0x1234';
   * const hex = Hex.validate.call(str); // validated Hex
   * ```
   */
  export function validate(this: string): Unsized {
    if (this.length < 2 || !this.startsWith("0x")) throw new InvalidFormatError();
    for (let i = 2; i < this.length; i++) {
      if (hexCharToValue(this[i]) === null) throw new InvalidCharacterError();
    }
    return this as Unsized;
  }

  /**
   * Assert hex has specific size
   *
   * @param size - Expected byte size
   * @returns Sized hex string
   * @throws {InvalidLengthError} If size doesn't match
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const sized = Hex.assertSize.call(hex, 2); // Hex.Sized<2>
   * ```
   */
  export function assertSize<TSize extends number>(
    this: Unsized,
    size: TSize,
  ): Sized<TSize> {
    if ((this.length - 2) / 2 !== size) {
      throw new InvalidLengthError(`Expected ${size} bytes, got ${(this.length - 2) / 2}`);
    }
    return this as Sized<TSize>;
  }

  // ==========================================================================
  // Conversion Operations
  // ==========================================================================

  /**
   * Convert bytes to hex
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
   * Convert hex to bytes
   *
   * @returns Byte array
   * @throws {InvalidFormatError} If missing 0x prefix
   * @throws {OddLengthError} If hex has odd number of digits
   * @throws {InvalidCharacterError} If contains invalid hex characters
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const bytes = Hex.toBytes.call(hex); // Uint8Array([0x12, 0x34])
   * ```
   */
  export function toBytes(this: Unsized): Uint8Array {
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = this.slice(2);
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
   * Convert number to hex
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
   * Convert hex to number
   *
   * @returns Number value
   * @throws {RangeError} If hex represents value larger than MAX_SAFE_INTEGER
   *
   * @example
   * ```typescript
   * const hex: Hex = '0xff';
   * const num = Hex.toNumber.call(hex); // 255
   * ```
   */
  export function toNumber(this: Unsized): number {
    const num = parseInt(this.slice(2), 16);
    if (!Number.isSafeInteger(num)) {
      throw new RangeError("Hex value exceeds MAX_SAFE_INTEGER");
    }
    return num;
  }

  /**
   * Convert bigint to hex
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
   * Convert hex to bigint
   *
   * @returns BigInt value
   *
   * @example
   * ```typescript
   * const hex: Hex = '0xff';
   * const big = Hex.toBigInt.call(hex); // 255n
   * ```
   */
  export function toBigInt(this: Unsized): bigint {
    return BigInt(this);
  }

  /**
   * Convert string to hex
   *
   * @param str - String to convert
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
   * Convert hex to string
   *
   * @returns Decoded string
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x68656c6c6f';
   * const str = Hex.toString.call(hex); // 'hello'
   * ```
   */
  export function toString(this: Unsized): string {
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = this.slice(2);
    if (hexDigits.length % 2 !== 0) throw new OddLengthError();
    const bytes = new Uint8Array(hexDigits.length / 2);
    for (let i = 0; i < hexDigits.length; i += 2) {
      const high = hexCharToValue(hexDigits[i]);
      const low = hexCharToValue(hexDigits[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytes[i / 2] = high * 16 + low;
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  /**
   * Convert boolean to hex
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
   * Convert hex to boolean
   *
   * @returns Boolean value (true if non-zero, false if zero)
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x01';
   * const bool = Hex.toBoolean.call(hex); // true
   * ```
   */
  export function toBoolean(this: Unsized): boolean {
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = this.slice(2);
    if (hexDigits.length % 2 !== 0) throw new OddLengthError();
    const bytes = new Uint8Array(hexDigits.length / 2);
    for (let i = 0; i < hexDigits.length; i += 2) {
      const high = hexCharToValue(hexDigits[i]);
      const low = hexCharToValue(hexDigits[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytes[i / 2] = high * 16 + low;
    }
    return bytes.some((b) => b !== 0);
  }

  // ==========================================================================
  // Size Operations
  // ==========================================================================

  /**
   * Get byte size of hex
   *
   * @returns Size in bytes
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const s = Hex.size.call(hex); // 2
   * ```
   */
  export function size(this: Unsized): number {
    return (this.length - 2) / 2;
  }

  // ==========================================================================
  // Manipulation Operations
  // ==========================================================================

  /**
   * Concatenate multiple hex strings
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
    const allBytes = hexes.flatMap((h) => {
      if (!h.startsWith("0x")) throw new InvalidFormatError();
      const hexDigits = h.slice(2);
      if (hexDigits.length % 2 !== 0) throw new OddLengthError();
      const bytes = new Uint8Array(hexDigits.length / 2);
      for (let i = 0; i < hexDigits.length; i += 2) {
        const high = hexCharToValue(hexDigits[i]);
        const low = hexCharToValue(hexDigits[i + 1]);
        if (high === null || low === null) throw new InvalidCharacterError();
        bytes[i / 2] = high * 16 + low;
      }
      return Array.from(bytes);
    });
    return fromBytes(new Uint8Array(allBytes));
  }

  /**
   * Slice hex string
   *
   * @param start - Start byte index
   * @param end - End byte index (optional)
   * @returns Sliced hex string
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x123456';
   * const sliced = Hex.slice.call(hex, 1); // '0x3456'
   * ```
   */
  export function slice(this: Unsized, start: number, end?: number): Unsized {
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = this.slice(2);
    if (hexDigits.length % 2 !== 0) throw new OddLengthError();
    const bytes = new Uint8Array(hexDigits.length / 2);
    for (let i = 0; i < hexDigits.length; i += 2) {
      const high = hexCharToValue(hexDigits[i]);
      const low = hexCharToValue(hexDigits[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytes[i / 2] = high * 16 + low;
    }
    return fromBytes(bytes.slice(start, end));
  }

  /**
   * Pad hex to target size (left-padded with zeros)
   *
   * @param targetSize - Target size in bytes
   * @returns Padded hex string
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const padded = Hex.pad.call(hex, 4); // '0x00001234'
   * ```
   */
  export function pad(this: Unsized, targetSize: number): Unsized {
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = this.slice(2);
    if (hexDigits.length % 2 !== 0) throw new OddLengthError();
    const bytes = new Uint8Array(hexDigits.length / 2);
    for (let i = 0; i < hexDigits.length; i += 2) {
      const high = hexCharToValue(hexDigits[i]);
      const low = hexCharToValue(hexDigits[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytes[i / 2] = high * 16 + low;
    }
    if (bytes.length >= targetSize) return fromBytes(bytes);
    const padded = new Uint8Array(targetSize);
    padded.set(bytes, targetSize - bytes.length);
    return fromBytes(padded);
  }

  /**
   * Pad hex to right (suffix with zeros)
   *
   * @param targetSize - Target size in bytes
   * @returns Right-padded hex string
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x1234';
   * const padded = Hex.padRight.call(hex, 4); // '0x12340000'
   * ```
   */
  export function padRight(this: Unsized, targetSize: number): Unsized {
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = this.slice(2);
    if (hexDigits.length % 2 !== 0) throw new OddLengthError();
    const bytes = new Uint8Array(hexDigits.length / 2);
    for (let i = 0; i < hexDigits.length; i += 2) {
      const high = hexCharToValue(hexDigits[i]);
      const low = hexCharToValue(hexDigits[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytes[i / 2] = high * 16 + low;
    }
    if (bytes.length >= targetSize) return fromBytes(bytes);
    const padded = new Uint8Array(targetSize);
    padded.set(bytes, 0);
    return fromBytes(padded);
  }

  /**
   * Trim leading zeros from hex
   *
   * @returns Trimmed hex string
   *
   * @example
   * ```typescript
   * const hex: Hex = '0x00001234';
   * const trimmed = Hex.trim.call(hex); // '0x1234'
   * ```
   */
  export function trim(this: Unsized): Unsized {
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigits = this.slice(2);
    if (hexDigits.length % 2 !== 0) throw new OddLengthError();
    const bytes = new Uint8Array(hexDigits.length / 2);
    for (let i = 0; i < hexDigits.length; i += 2) {
      const high = hexCharToValue(hexDigits[i]);
      const low = hexCharToValue(hexDigits[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytes[i / 2] = high * 16 + low;
    }
    let start = 0;
    while (start < bytes.length && bytes[start] === 0) start++;
    return fromBytes(bytes.slice(start));
  }

  // ==========================================================================
  // Comparison Operations
  // ==========================================================================

  /**
   * Check if two hex strings are equal
   *
   * @param other - Hex string to compare with
   * @returns True if equal
   *
   * @example
   * ```typescript
   * const hex1: Hex = '0x1234';
   * Hex.equals.call(hex1, '0x1234'); // true
   * ```
   */
  export function equals(this: Unsized, other: Unsized): boolean {
    return this.toLowerCase() === other.toLowerCase();
  }

  // ==========================================================================
  // Bitwise Operations
  // ==========================================================================

  /**
   * XOR with another hex string of same length
   *
   * @param other - Hex string to XOR with
   * @returns XOR result
   * @throws {InvalidLengthError} If lengths don't match
   *
   * @example
   * ```typescript
   * const hex1: Hex = '0x12';
   * const result = Hex.xor.call(hex1, '0x34'); // '0x26'
   * ```
   */
  export function xor(this: Unsized, other: Unsized): Unsized {
    // Convert this to bytes
    if (!this.startsWith("0x")) throw new InvalidFormatError();
    const hexDigitsA = this.slice(2);
    if (hexDigitsA.length % 2 !== 0) throw new OddLengthError();
    const bytesA = new Uint8Array(hexDigitsA.length / 2);
    for (let i = 0; i < hexDigitsA.length; i += 2) {
      const high = hexCharToValue(hexDigitsA[i]);
      const low = hexCharToValue(hexDigitsA[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytesA[i / 2] = high * 16 + low;
    }

    // Convert other to bytes
    if (!other.startsWith("0x")) throw new InvalidFormatError();
    const hexDigitsB = other.slice(2);
    if (hexDigitsB.length % 2 !== 0) throw new OddLengthError();
    const bytesB = new Uint8Array(hexDigitsB.length / 2);
    for (let i = 0; i < hexDigitsB.length; i += 2) {
      const high = hexCharToValue(hexDigitsB[i]);
      const low = hexCharToValue(hexDigitsB[i + 1]);
      if (high === null || low === null) throw new InvalidCharacterError();
      bytesB[i / 2] = high * 16 + low;
    }

    if (bytesA.length !== bytesB.length) {
      throw new InvalidLengthError("Hex strings must have same length for XOR");
    }
    const result = new Uint8Array(bytesA.length);
    for (let i = 0; i < bytesA.length; i++) {
      result[i] = bytesA[i] ^ bytesB[i];
    }
    return fromBytes(result);
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Generate random hex of specific size
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
   * Create zero-filled hex of specific size
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

// Re-export error types for backward compatibility
export const InvalidHexFormatError = Hex.InvalidFormatError;
export const InvalidHexCharacterError = Hex.InvalidCharacterError;
export const OddLengthHexError = Hex.OddLengthError;
export const InvalidHexLengthError = Hex.InvalidLengthError;

// Re-export namespace as default
export default Hex;
