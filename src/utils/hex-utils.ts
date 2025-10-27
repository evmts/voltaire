/**
 * Extended hex utilities
 * Additional hex string manipulation beyond basic encoding/decoding
 */

export type Hex = `0x${string}`;

/**
 * Encode boolean as hex
 * @param value - Boolean value
 * @returns "0x1" for true, "0x0" for false
 */
export function boolToHex(value: boolean): Hex {
	throw new Error("not implemented");
}

/**
 * Decode hex to boolean
 * @param hex - Hex string
 * @returns true if non-zero, false if zero
 */
export function hexToBool(hex: Hex): boolean {
	throw new Error("not implemented");
}

/**
 * Encode number as hex
 * @param value - Number or bigint
 * @returns Hex string without leading zeros (except "0x0")
 */
export function numberToHex(value: number | bigint): Hex {
	throw new Error("not implemented");
}

/**
 * Decode hex to number
 * @param hex - Hex string
 * @returns Number value
 */
export function hexToNumber(hex: Hex): number {
	throw new Error("not implemented");
}

/**
 * Decode hex to bigint
 * @param hex - Hex string
 * @returns BigInt value
 */
export function hexToBigInt(hex: Hex): bigint {
	throw new Error("not implemented");
}

/**
 * Get size of hex string in bytes
 * @param hex - Hex string
 * @returns Number of bytes
 */
export function hexSize(hex: Hex): number {
	throw new Error("not implemented");
}

/**
 * Validate hex string format
 * @param hex - Value to check
 * @returns True if valid hex with 0x prefix
 */
export function isHex(hex: unknown): hex is Hex {
	throw new Error("not implemented");
}

/**
 * Pad hex string to specific byte size (left padding)
 * @param hex - Input hex string
 * @param size - Target size in bytes
 * @returns Padded hex string
 */
export function padHex(hex: Hex, size: number): Hex {
	throw new Error("not implemented");
}

/**
 * Trim leading zeros from hex string
 * @param hex - Input hex string
 * @returns Hex string without leading zeros (keeps "0x0" for zero)
 */
export function trimHex(hex: Hex): Hex {
	throw new Error("not implemented");
}

/**
 * Slice hex string by byte positions
 * @param hex - Input hex string
 * @param start - Start byte position (inclusive)
 * @param end - End byte position (exclusive)
 * @returns Sliced hex string
 */
export function sliceHex(hex: Hex, start: number, end?: number): Hex {
	throw new Error("not implemented");
}

/**
 * Concatenate multiple hex strings
 * @param hexStrings - Array of hex strings
 * @returns Concatenated hex string
 */
export function concatHex(hexStrings: Hex[]): Hex {
	throw new Error("not implemented");
}

/**
 * Encode string as hex (UTF-8)
 * @param value - String to encode
 * @returns Hex-encoded string
 */
export function stringToHex(value: string): Hex {
	throw new Error("not implemented");
}

/**
 * Decode hex to string (UTF-8)
 * @param hex - Hex string
 * @returns Decoded string
 */
export function hexToString(hex: Hex): string {
	throw new Error("not implemented");
}

/**
 * Compare two hex strings for equality
 * @param a - First hex string
 * @param b - Second hex string
 * @returns True if equal (ignoring case)
 */
export function hexEquals(a: Hex, b: Hex): boolean {
	throw new Error("not implemented");
}
