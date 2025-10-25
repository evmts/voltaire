/**
 * Branded Uint type for hex-encoded unsigned integers
 *
 * Ensures hex strings represent valid unsigned integers with no leading zeros
 * except for the special case of "0x0".
 *
 * Pattern: ^0x(0|[1-9a-f][0-9a-f]*)$
 * - Must start with "0x"
 * - Either exactly "0x0" OR starts with [1-9a-f] followed by any hex digits
 * - Lowercase hex only
 */

/**
 * Branded type for unsigned integer hex strings
 */
export type Uint = `0x${string}` & { readonly __brand: 'Uint' };

/**
 * Regular expression for validating Uint format
 * Matches: 0x0, 0x1, 0xa, 0x10, 0xff, 0x1234abcd
 * Rejects: 0x, 0x00, 0x01, 0x00ab (leading zeros), 0xg (invalid chars)
 */
const UINT_PATTERN = /^0x(0|[1-9a-f][0-9a-f]*)$/;

/**
 * Validates if a hex string is a valid Uint
 * @param hex - Hex string to validate
 * @returns true if valid Uint format
 */
function isValidUintHex(hex: string): boolean {
	return UINT_PATTERN.test(hex);
}

/**
 * Normalizes a bigint to Uint hex format
 * @param value - BigInt value to convert
 * @returns Normalized hex string with no leading zeros
 */
function bigintToUintHex(value: bigint): string {
	if (value < 0n) {
		throw new Error(`Uint must be non-negative, got ${value}`);
	}

	// BigInt.toString(16) already omits leading zeros
	const hex = value.toString(16);
	return `0x${hex}`;
}

/**
 * Creates a Uint from a hex string or bigint
 *
 * @param value - Hex string with "0x" prefix or bigint
 * @returns Validated Uint type
 * @throws Error if invalid format or negative value
 *
 * @example
 * ```typescript
 * Uint("0x0")        // "0x0"
 * Uint("0x1")        // "0x1"
 * Uint("0xff")       // "0xff"
 * Uint(255n)         // "0xff"
 * Uint("0x00")       // Error: leading zeros
 * Uint(-1n)          // Error: negative
 * ```
 */
export function Uint(value: `0x${string}` | bigint): Uint {
	let hex: string;

	if (typeof value === 'bigint') {
		hex = bigintToUintHex(value);
	} else {
		hex = value.toLowerCase();
	}

	if (!isValidUintHex(hex)) {
		throw new Error(
			`Invalid Uint format: ${hex}. Must match pattern ^0x(0|[1-9a-f][0-9a-f]*)$ (no leading zeros except 0x0)`
		);
	}

	return hex as Uint;
}

/**
 * Type guard to check if a value is a Uint
 * @param value - Value to check
 * @returns true if value is a valid Uint
 */
export function isUint(value: unknown): value is Uint {
	return typeof value === 'string' && isValidUintHex(value);
}

/**
 * Converts a Uint to bigint
 * @param uint - Uint to convert
 * @returns BigInt representation
 */
export function uintToBigInt(uint: Uint): bigint {
	return BigInt(uint);
}

/**
 * Common Uint constants
 */
export const UINT_ZERO = Uint(0n);
export const UINT_ONE = Uint(1n);
export const UINT_MAX_U8 = Uint(0xffn);
export const UINT_MAX_U16 = Uint(0xffffn);
export const UINT_MAX_U32 = Uint(0xffffffffn);
export const UINT_MAX_U64 = Uint(0xffffffffffffffffn);
export const UINT_MAX_U128 = Uint((1n << 128n) - 1n);
export const UINT_MAX_U256 = Uint((1n << 256n) - 1n);
