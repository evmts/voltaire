/**
 * Signature Module - Ox-based Implementation
 *
 * This module provides signature manipulation and validation utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * According to OX_MIGRATION_MAPPING.md: 26 exports, 100% API compatibility.
 */

// ============================================================================
// Ox Re-exports (Core Functionality - 100% Compatible)
// ============================================================================

export {
	// Constructors
	from,
	fromHex,
	fromBytes,
	fromTuple,
	fromRpc,
	fromLegacy,
	fromDerHex,
	fromDerBytes,
	// Converters
	toHex,
	toBytes,
	toTuple,
	toRpc,
	toLegacy,
	toDerHex,
	toDerBytes,
	// Utilities
	extract,
	validate,
	assert,
	vToYParity,
	yParityToV,
	// Types
	type Signature,
} from "ox/Signature";
