/**
 * Hex Module - Ox-based Implementation
 *
 * This module provides hex string manipulation utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire-specific extensions are provided for functions not available in Ox.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Constructors
	from,
	fromBoolean,
	fromBytes,
	fromNumber,
	fromString,
	// Converters
	toBoolean,
	toBytes,
	toNumber,
	toString,
	toBigInt,
	// Manipulations
	concat,
	slice,
	padLeft,
	padRight,
	trimLeft,
	trimRight,
	// Utilities
	size,
	isEqual,
	validate,
	assert,
	random,
	// Types
	type Hex,
} from "ox/Hex";

// ============================================================================
// Voltaire Extensions (Functions missing in Ox)
// ============================================================================

export { xor, zero, isSized, assertSize } from "./extensions/index.js";

// ============================================================================
// Compatibility Aliases (Minor naming differences)
// ============================================================================

// Ox uses `isEqual`, Voltaire historically used `equals`
export { isEqual as equals } from "ox/Hex";

// Ox uses `padLeft`, provide generic `pad` as alias (defaults to left padding)
export { padLeft as pad } from "ox/Hex";

// Ox uses `trimLeft`, provide generic `trim` as alias (defaults to left trim)
export { trimLeft as trim } from "ox/Hex";

// ============================================================================
// Additional constructors not directly in Ox
// ============================================================================

import * as OxHex from "ox/Hex";
import type { Hex } from "ox";

/**
 * Create hex from BigInt
 * Ox's `from()` handles this but we provide explicit function for clarity
 */
export function fromBigInt(value: bigint, size?: number): Hex.Hex {
	const hex = OxHex.fromNumber(value, size ? { size } : undefined);
	return hex;
}

/**
 * Check if value is valid hex
 * Returns boolean instead of throwing
 */
export function isHex(value: unknown): value is Hex.Hex {
	if (typeof value !== "string") return false;
	if (!value.startsWith("0x")) return false;
	// Check if remaining characters are valid hex
	const hexPart = value.slice(2);
	return /^[0-9a-fA-F]*$/.test(hexPart);
}

/**
 * Clone hex value (returns same value since hex is immutable string)
 */
export function clone(value: Hex.Hex): Hex.Hex {
	return value;
}
