/**
 * Hexadecimal utilities for Ethereum
 *
 * Provides conversion between hex strings and bytes, validation, and
 * numeric conversions. All hex strings use the "0x" prefix convention.
 */

import { dlopen, FFIType, suffix, ptr } from "bun:ffi";
import { join } from "path";

// Load the native library
const libPath = join(import.meta.dir, "../../zig-out/lib/libprimitives_c.a");

// Note: For now, we'll implement these in pure TypeScript since FFI with static libraries
// is more complex. In production, we'd use a shared library (.dylib/.so/.dll) instead.

/**
 * Check if a string is a valid hex string (with 0x prefix)
 * @param input - String to validate
 * @returns true if valid hex string, false otherwise
 */
export function isHex(input: string): boolean {
  if (input.length < 3) return false; // At least "0x" + one hex digit
  if (!input.startsWith("0x")) return false;

  for (let i = 2; i < input.length; i++) {
    const c = input.charCodeAt(i);
    const valid =
      (c >= 48 && c <= 57) || // 0-9
      (c >= 97 && c <= 102) || // a-f
      (c >= 65 && c <= 70); // A-F
    if (!valid) return false;
  }
  return true;
}

/**
 * Convert hex string to bytes
 * @param hex - Hex string with 0x prefix
 * @returns Uint8Array of bytes
 * @throws Error if invalid hex format
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length < 2 || !hex.startsWith("0x")) {
    throw new Error("Invalid hex format: missing 0x prefix");
  }

  const hexDigits = hex.slice(2);
  if (hexDigits.length % 2 !== 0) {
    throw new Error("Invalid hex format: odd length");
  }

  const bytes = new Uint8Array(hexDigits.length / 2);
  for (let i = 0; i < hexDigits.length; i += 2) {
    const high = hexCharToValue(hexDigits.charCodeAt(i));
    const low = hexCharToValue(hexDigits.charCodeAt(i + 1));

    if (high === -1 || low === -1) {
      throw new Error("Invalid hex character");
    }

    bytes[i / 2] = high * 16 + low;
  }

  return bytes;
}

/**
 * Convert bytes to hex string (with 0x prefix)
 * @param bytes - Byte array to convert
 * @returns Hex string with 0x prefix
 */
export function bytesToHex(bytes: Uint8Array): string {
  const hexChars = "0123456789abcdef";
  let result = "0x";

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;
    result += hexChars[byte >> 4]! + hexChars[byte & 0x0f]!;
  }

  return result;
}

/**
 * Convert hex string to u256 number
 * @param hex - Hex string with 0x prefix
 * @returns bigint value
 * @throws Error if invalid hex or value too large
 */
export function hexToU256(hex: string): bigint {
  if (hex.length < 2 || !hex.startsWith("0x")) {
    throw new Error("Invalid hex format: missing 0x prefix");
  }

  const hexDigits = hex.slice(2);
  if (hexDigits.length === 0) {
    return 0n;
  }

  try {
    return BigInt(hex);
  } catch (err) {
    throw new Error("Invalid hex character");
  }
}

/**
 * Convert u256 number to hex string (with 0x prefix)
 * @param value - bigint value to convert
 * @returns Hex string with 0x prefix
 * @throws Error if value exceeds u256 range
 */
export function u256ToHex(value: bigint): string {
  if (value < 0n) {
    throw new Error("Value must be non-negative");
  }

  // Max u256 is 2^256 - 1
  const maxU256 = (1n << 256n) - 1n;
  if (value > maxU256) {
    throw new Error("Value exceeds u256 range");
  }

  if (value === 0n) {
    return "0x0";
  }

  return "0x" + value.toString(16);
}

// Helper function to convert hex character to value
function hexCharToValue(charCode: number): number {
  if (charCode >= 48 && charCode <= 57) return charCode - 48; // 0-9
  if (charCode >= 97 && charCode <= 102) return charCode - 97 + 10; // a-f
  if (charCode >= 65 && charCode <= 70) return charCode - 65 + 10; // A-F
  return -1;
}
