/**
 * Base64 Module - Ox-based Implementation
 *
 * This module provides base64 encoding/decoding utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire-specific extensions are provided for functions not available in Ox.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Encoders (string to Base64)
	fromBytes,
	fromHex,
	fromString,
	// Decoders (Base64 to string/bytes/hex)
	toBytes,
	toHex,
	toString,
} from "ox/Base64";

// ============================================================================
// Voltaire Extensions (Functions missing in Ox)
// ============================================================================

export {
	encodeUrlSafe,
	decodeUrlSafe,
	encodeStringUrlSafe,
	decodeUrlSafeToString,
	isValid,
	isValidUrlSafe,
	calcEncodedSize,
	calcDecodedSize,
} from "./extensions/index.js";

// ============================================================================
// Compatibility Layer (Map Voltaire API to Ox)
// ============================================================================

import * as OxBase64 from "ox/Base64";

/**
 * Encode bytes to base64 (Voltaire API compatibility)
 */
export function encode(value: Uint8Array): string {
	return OxBase64.fromBytes(value);
}

/**
 * Decode base64 to bytes (Voltaire API compatibility)
 */
export function decode(value: string): Uint8Array {
	return OxBase64.toBytes(value);
}

/**
 * Encode string to base64 (Voltaire API compatibility)
 */
export function encodeString(value: string): string {
	return OxBase64.fromString(value);
}

/**
 * Decode base64 to string (Voltaire API compatibility)
 */
export function decodeToString(value: string): string {
	return OxBase64.toString(value);
}
