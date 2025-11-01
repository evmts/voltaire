/**
 * RLP (Recursive Length Prefix) - Ethereum's serialization format
 *
 * Complete RLP encoding/decoding with strict validation matching Ethereum's spec.
 * All functions use the "this:" pattern where data is operated on.
 *
 * @example
 * ```typescript
 * import * as Rlp from './rlp.js';
 *
 * // Encode data
 * const list = [new Uint8Array([1, 2, 3])];
 * const encoded = Rlp.encode.call(list);
 *
 * // Decode data
 * const bytes = new Uint8Array([0x83, 0x01, 0x02, 0x03]);
 * const decoded = Rlp.decode.call(bytes);
 * ```
 */

import { MAX_DEPTH } from "./constants.js";
import { Error } from "./errors.js";
import { encodeLengthValue, decodeLengthValue } from "./utils.js";

// ============================================================================
// Core Types
// ============================================================================

/**
 * RLP data type - discriminated union of bytes or list
 */
export type Data =
	| { type: "bytes"; value: Uint8Array }
	| { type: "list"; value: Data[] };

/**
 * Decoded RLP data with remainder (for stream decoding)
 */
export type Decoded = {
	data: Data;
	remainder: Uint8Array;
};

/**
 * Types that can be encoded to RLP
 * - Uint8Array (bytes)
 * - Data (already structured)
 * - Array of Encodable (list)
 */
export type Encodable = Uint8Array | Data | Encodable[];

/**
 * RLP Data type alias for convenient importing
 */
export type Rlp = Data;

// Legacy type exports
export type RlpData = Data;
export type RlpDecoded = Decoded;
export type RlpEncodable = Encodable;

// ============================================================================
// Exports
// ============================================================================

export * from "./constants.js";
export * from "./errors.js";
export { isData } from "./isData.js";
export { isBytesData } from "./isBytesData.js";
export { isListData } from "./isListData.js";
export { encode } from "./encode.js";
export { encodeBytes } from "./encodeBytes.js";
export { encodeList } from "./encodeList.js";
export { decode } from "./decode.js";
export { getEncodedLength } from "./getEncodedLength.js";
export { flatten } from "./flatten.js";
export { equals } from "./equals.js";
export { toJSON } from "./toJSON.js";
export { fromJSON } from "./fromJSON.js";

// Data namespace operations
export * as Data from "./Data.js";
