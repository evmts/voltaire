/**
 * Base64 Encoding/Decoding
 *
 * Standard and URL-safe base64 encoding with proper padding.
 * Built on Web APIs for maximum performance and compatibility.
 *
 * @example
 * ```typescript
 * import { Base64 } from './base64.js';
 *
 * // Encode bytes to base64
 * const data = new Uint8Array([1, 2, 3]);
 * const encoded = Base64.encode(data);
 *
 * // Decode base64 to bytes
 * const decoded = Base64.decode(encoded);
 *
 * // URL-safe encoding
 * const urlSafe = Base64.encodeUrlSafe(data);
 * ```
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Base64-encoded string (standard alphabet)
 */
export type Base64String = string;

/**
 * URL-safe base64-encoded string (no padding, - and _ instead of + and /)
 */
export type Base64UrlString = string;

// ============================================================================
// Encoding Functions
// ============================================================================

/**
 * Encode bytes to standard base64 string
 *
 * Uses standard base64 alphabet (A-Z, a-z, 0-9, +, /)
 * with padding (=)
 *
 * @param data - Bytes to encode
 * @returns Base64-encoded string
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([72, 101, 108, 108, 111]);
 * const encoded = Base64.encode(data);
 * // "SGVsbG8="
 * ```
 */
export function encode(data: Uint8Array): Base64String {
  // Convert to binary string
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i] as number);
  }
  return btoa(binary);
}

/**
 * Encode bytes to URL-safe base64 string
 *
 * Uses URL-safe alphabet (A-Z, a-z, 0-9, -, _)
 * without padding
 *
 * @param data - Bytes to encode
 * @returns URL-safe base64 string
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([255, 254, 253]);
 * const encoded = Base64.encodeUrlSafe(data);
 * // No padding, uses - and _ instead of + and /
 * ```
 */
export function encodeUrlSafe(data: Uint8Array): Base64UrlString {
  return encode(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Encode string to base64
 *
 * @param str - String to encode (UTF-8)
 * @returns Base64-encoded string
 *
 * @example
 * ```typescript
 * const encoded = Base64.encodeString('Hello, world!');
 * ```
 */
export function encodeString(str: string): Base64String {
  const encoder = new TextEncoder();
  return encode(encoder.encode(str));
}

/**
 * Encode string to URL-safe base64
 *
 * @param str - String to encode (UTF-8)
 * @returns URL-safe base64 string
 */
export function encodeStringUrlSafe(str: string): Base64UrlString {
  const encoder = new TextEncoder();
  return encodeUrlSafe(encoder.encode(str));
}

// ============================================================================
// Decoding Functions
// ============================================================================

/**
 * Decode standard base64 string to bytes
 *
 * @param encoded - Base64 string to decode
 * @returns Decoded bytes
 * @throws {Error} If input is invalid base64
 *
 * @example
 * ```typescript
 * const decoded = Base64.decode('SGVsbG8=');
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function decode(encoded: Base64String): Uint8Array {
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new Error(`Invalid base64: ${error}`);
  }
}

/**
 * Decode URL-safe base64 string to bytes
 *
 * @param encoded - URL-safe base64 string
 * @returns Decoded bytes
 * @throws {Error} If input is invalid
 */
export function decodeUrlSafe(encoded: Base64UrlString): Uint8Array {
  // Convert to standard base64
  let standard = encoded.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding
  const pad = encoded.length % 4;
  if (pad === 2) standard += '==';
  else if (pad === 3) standard += '=';

  return decode(standard);
}

/**
 * Decode base64 string to UTF-8 string
 *
 * @param encoded - Base64 string
 * @returns Decoded string
 *
 * @example
 * ```typescript
 * const str = Base64.decodeToString('SGVsbG8=');
 * // "Hello"
 * ```
 */
export function decodeToString(encoded: Base64String): string {
  const decoder = new TextDecoder();
  return decoder.decode(decode(encoded));
}

/**
 * Decode URL-safe base64 to UTF-8 string
 *
 * @param encoded - URL-safe base64 string
 * @returns Decoded string
 */
export function decodeUrlSafeToString(encoded: Base64UrlString): string {
  const decoder = new TextDecoder();
  return decoder.decode(decodeUrlSafe(encoded));
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if string is valid base64
 *
 * @param str - String to validate
 * @returns True if valid base64
 */
export function isValid(str: string): boolean {
  if (str.length === 0) return true;

  // Check if valid base64 pattern
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) return false;

  // Check padding
  if (str.length % 4 !== 0) return false;

  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is valid URL-safe base64
 *
 * @param str - String to validate
 * @returns True if valid URL-safe base64
 */
export function isValidUrlSafe(str: string): boolean {
  if (str.length === 0) return true;

  // Check if valid URL-safe base64 pattern (no padding)
  const urlSafeRegex = /^[A-Za-z0-9_-]*$/;
  return urlSafeRegex.test(str);
}

// ============================================================================
// Size Calculation
// ============================================================================

/**
 * Calculate encoded size in bytes
 *
 * @param dataLength - Length of data to encode
 * @returns Size of base64 output
 */
export function calcEncodedSize(dataLength: number): number {
  return Math.ceil(dataLength / 3) * 4;
}

/**
 * Calculate decoded size in bytes
 *
 * @param encodedLength - Length of base64 string
 * @returns Maximum size of decoded output
 */
export function calcDecodedSize(encodedLength: number): number {
  const padding = encodedLength > 0 && encodedLength % 4 === 0 ? 2 : 0;
  return Math.floor((encodedLength * 3) / 4) - padding;
}
