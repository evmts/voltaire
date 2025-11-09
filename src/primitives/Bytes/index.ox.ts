/**
 * Bytes Module - Ox-based Implementation
 *
 * This module provides Uint8Array manipulation utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire-specific extensions are provided for functions not available in Ox.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Constructors
	from,
	fromArray,
	fromBoolean,
	fromHex,
	fromNumber,
	fromString,
	// Converters
	toBigInt,
	toBoolean,
	toHex,
	toNumber,
	toString,
	// Manipulations
	concat,
	padLeft,
	padRight,
	slice,
	trimLeft,
	trimRight,
	// Utilities
	assert,
	isEqual,
	random,
	size,
	validate,
	// Types
	type Bytes,
} from "ox/Bytes";

// ============================================================================
// Compatibility Aliases (Minor naming differences)
// ============================================================================

// Ox uses `isEqual`, provide `equals` alias for backward compatibility
export { isEqual as equals } from "ox/Bytes";

// Ox uses `padLeft`, provide generic `pad` as alias (defaults to left padding)
export { padLeft as pad } from "ox/Bytes";

// Ox uses `trimLeft`, provide generic `trim` as alias (defaults to left trim)
export { trimLeft as trim } from "ox/Bytes";

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Check if value is a Bytes (Uint8Array)
 * @param value - Value to check
 * @returns True if value is a Uint8Array
 */
export function isBytes(value: unknown): value is Uint8Array {
	return value instanceof Uint8Array;
}

/**
 * Clone bytes array (creates a copy)
 * @param value - Bytes to clone
 * @returns New Uint8Array with same contents
 */
export function clone(value: Uint8Array): Uint8Array {
	return new Uint8Array(value);
}
