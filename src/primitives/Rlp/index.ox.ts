/**
 * Rlp Module - Ox-based Implementation
 *
 * This module provides Recursive Length Prefix (RLP) encoding/decoding utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire-specific extensions and compatibility aliases are provided for seamless migration.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Constructors
	from,
	fromBytes,
	fromHex,
	// Converters
	toBytes,
	toHex,
	to,
	// Utilities
	readLength,
	readList,
	decodeRlpCursor,
} from "ox/Rlp";

// ============================================================================
// Compatibility Aliases (Voltaire → Ox naming conventions)
// ============================================================================

import * as OxRlp from "ox/Rlp";
import type { Hex as HexType } from "ox/Hex";
import type { Bytes as BytesType } from "ox/Bytes";

/**
 * Alias: `encode()` → Ox `from()`
 * Voltaire historically used `encode()`, Ox uses `from()`.
 * Wrapper that defaults to Hex output format.
 */
export function encode(value: Parameters<typeof OxRlp.from>[0]): HexType {
	return OxRlp.from(value, { as: "Hex" });
}

/**
 * Alias: `encodeBytes()` → Ox `from()` with Bytes output
 * Encoding bytes/data to RLP format, returns Bytes.
 */
export function encodeBytes(value: Parameters<typeof OxRlp.from>[0]): BytesType {
	return OxRlp.from(value, { as: "Bytes" });
}

/**
 * Alias: `decode()` → Ox `fromBytes()`
 * Decoding RLP-encoded bytes. Returns decoded data as Bytes.
 */
export const decode = OxRlp.fromBytes;

/**
 * Alias: `decodeHex()` → Ox `fromHex()`
 * Decoding RLP-encoded hex string. Returns decoded data as Hex.
 */
export const decodeHex = OxRlp.fromHex;
