import type { HexType, Sized } from "./HexType.js";
import * as HexFuncs from "./internal-index.js";

// Re-export errors
export * from "./errors.js";

// Re-export commonly used functions at module level for convenience
export const fromBytes = HexFuncs.fromBytes;
export const toBytes = HexFuncs.toBytes;

/**
 * Factory function for creating Hex instances (canonical constructor)
 *
 * @param value - Hex string or bytes
 * @returns Hex value
 * @example
 * ```ts
 * import { Hex } from '@voltaire/primitives/Hex';
 * const hex = Hex('0x1234');
 * ```
 */
export function Hex(value: string | Uint8Array): HexType {
	return HexFuncs.from(value);
}

/**
 * Alias for Hex() - creates a Hex instance from a value
 *
 * @deprecated Use Hex() directly instead
 */
Hex.from = (value: string | Uint8Array): HexType => HexFuncs.from(value);

/**
 * Convert bytes to hex string
 * @param value - Uint8Array to convert
 * @returns Hex string with 0x prefix
 * @example
 * ```ts
 * Hex.fromBytes(new Uint8Array([0x12, 0x34])); // '0x1234'
 * ```
 */
Hex.fromBytes = (value: Uint8Array): HexType => HexFuncs.fromBytes(value);

/**
 * Convert number to hex string
 * @param value - Number to convert
 * @param size - Optional byte size for padding
 * @returns Hex string with 0x prefix
 * @example
 * ```ts
 * Hex.fromNumber(255);     // '0xff'
 * Hex.fromNumber(255, 2);  // '0x00ff'
 * ```
 */
Hex.fromNumber = (value: number, size?: number): HexType =>
	HexFuncs.fromNumber(value, size);

/**
 * Convert bigint to hex string
 * @param value - BigInt to convert
 * @param size - Optional byte size for padding
 * @returns Hex string with 0x prefix
 * @example
 * ```ts
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
Hex.fromBigInt = (value: bigint, size?: number): HexType =>
	HexFuncs.fromBigInt(value, size);

/**
 * Convert UTF-8 string to hex (encodes string bytes)
 * @param value - UTF-8 string to encode
 * @returns Hex-encoded string bytes
 * @example
 * ```ts
 * Hex.fromString('hello'); // '0x68656c6c6f'
 * ```
 */
Hex.fromString = (value: string): HexType => HexFuncs.fromString(value);

/**
 * Convert boolean to hex
 * @param value - Boolean to convert
 * @returns '0x01' for true, '0x00' for false
 * @example
 * ```ts
 * Hex.fromBoolean(true);  // '0x01'
 * Hex.fromBoolean(false); // '0x00'
 * ```
 */
Hex.fromBoolean = (value: boolean): Sized<1> => HexFuncs.fromBoolean(value);

// ============================================================================
// Static utility methods
// ============================================================================

/**
 * Check if value is a valid hex string
 * @param value - Value to check
 * @returns True if valid hex with 0x prefix
 */
Hex.isHex = HexFuncs.isHex;

/**
 * Concatenate multiple hex strings
 * @param hexes - Hex strings to concatenate
 * @returns Combined hex string
 * @throws {InvalidFormatError} If any hex is invalid
 * @example
 * ```ts
 * Hex.concat('0x12', '0x34'); // '0x1234'
 * ```
 */
Hex.concat = HexFuncs.concat;

/**
 * Generate random hex of specific size
 * @param size - Size in bytes
 * @returns Random hex string
 * @example
 * ```ts
 * Hex.random(32); // random 32-byte hex
 * ```
 */
Hex.random = HexFuncs.random;

/**
 * Create zero-filled hex of specific size
 * @param size - Size in bytes
 * @returns Zero-filled hex string
 * @example
 * ```ts
 * Hex.zero(4); // '0x00000000'
 * ```
 */
Hex.zero = HexFuncs.zero;

/**
 * Validate and return hex string, throws if invalid
 * @param value - String to validate
 * @returns Validated hex string
 * @throws {InvalidFormatError} If not valid hex
 */
Hex.validate = HexFuncs.validate;

/**
 * Convert hex to bytes
 * @param hex - Hex string to convert
 * @returns Uint8Array of bytes
 * @throws {InvalidFormatError} If missing 0x prefix or invalid chars
 * @throws {InvalidLengthError} If odd number of hex digits
 * @example
 * ```ts
 * Hex.toBytes('0x1234'); // Uint8Array([0x12, 0x34])
 * ```
 */
Hex.toBytes = HexFuncs.toBytes;

/**
 * Convert hex to number
 * @param hex - Hex string to convert
 * @returns Number value
 * @example
 * ```ts
 * Hex.toNumber('0xff'); // 255
 * ```
 */
Hex.toNumber = HexFuncs.toNumber;

/**
 * Convert hex to bigint
 * @param hex - Hex string to convert
 * @returns BigInt value
 * @example
 * ```ts
 * Hex.toBigInt('0xff'); // 255n
 * ```
 */
Hex.toBigInt = HexFuncs.toBigInt;

/**
 * Decode hex to UTF-8 string
 * @param hex - Hex string to decode
 * @returns Decoded UTF-8 string
 */
Hex.toString = HexFuncs.toString;

/**
 * Convert hex to boolean
 * @param hex - Hex string ('0x01' or '0x00')
 * @returns Boolean value
 */
Hex.toBoolean = HexFuncs.toBoolean;

/**
 * Get byte size of hex string
 * @param hex - Hex string
 * @returns Size in bytes
 * @example
 * ```ts
 * Hex.size('0x1234'); // 2
 * ```
 */
Hex.size = HexFuncs.size;

/**
 * Check if hex is exactly the specified size
 * @param hex - Hex string to check
 * @param size - Expected size in bytes
 * @returns True if hex is exactly size bytes
 */
Hex.isSized = HexFuncs.isSized;

/**
 * Assert hex is exactly the specified size
 * @param hex - Hex string to check
 * @param size - Expected size in bytes
 * @throws {SizeError} If size doesn't match
 */
Hex.assertSize = HexFuncs.assertSize;

/**
 * Slice hex string by byte indices
 * @param hex - Hex string to slice
 * @param start - Start byte index
 * @param end - End byte index (optional)
 * @returns Sliced hex string
 * @example
 * ```ts
 * Hex.slice('0x123456', 1); // '0x3456'
 * Hex.slice('0x123456', 0, 1); // '0x12'
 * ```
 */
Hex.slice = HexFuncs.slice;

/**
 * Left-pad hex to target size with zeros
 * @param hex - Hex string to pad
 * @param size - Target size in bytes
 * @returns Padded hex string
 * @throws {SizeExceededError} If hex exceeds target size
 * @example
 * ```ts
 * Hex.pad('0x12', 4); // '0x00000012'
 * ```
 */
Hex.pad = HexFuncs.pad;

/**
 * Right-pad hex to target size with zeros
 * @param hex - Hex string to pad
 * @param size - Target size in bytes
 * @returns Padded hex string
 * @example
 * ```ts
 * Hex.padRight('0x12', 4); // '0x12000000'
 * ```
 */
Hex.padRight = HexFuncs.padRight;

/**
 * Trim leading zeros from hex
 * @param hex - Hex string to trim
 * @returns Trimmed hex string
 * @example
 * ```ts
 * Hex.trim('0x00001234'); // '0x1234'
 * ```
 */
Hex.trim = HexFuncs.trim;

/**
 * Check if two hex strings are equal (case-insensitive)
 * @param a - First hex string
 * @param b - Second hex string
 * @returns True if equal
 */
Hex.equals = HexFuncs.equals;

/**
 * XOR two hex strings
 * @param a - First hex string
 * @param b - Second hex string
 * @returns XOR result as hex string
 */
Hex.xor = HexFuncs.xor;

/**
 * Create a copy of a hex string
 * @param hex - Hex string to clone
 * @returns Copy of the hex string
 */
Hex.clone = HexFuncs.clone;

// Default export for dynamic imports
export default Hex;
