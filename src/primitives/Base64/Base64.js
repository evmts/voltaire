// @ts-nocheck
import { calcDecodedSize } from "./calcDecodedSize.js";
import { calcEncodedSize } from "./calcEncodedSize.js";
import { decode } from "./decode.js";
import { decodeToString } from "./decodeToString.js";
import { decodeUrlSafe } from "./decodeUrlSafe.js";
import { decodeUrlSafeToString } from "./decodeUrlSafeToString.js";
import { encode } from "./encode.js";
import { encodeString } from "./encodeString.js";
import { encodeStringUrlSafe } from "./encodeStringUrlSafe.js";
import { encodeUrlSafe } from "./encodeUrlSafe.js";
import { from } from "./from.js";
import { fromUrlSafe } from "./fromUrlSafe.js";
import { isValid } from "./isValid.js";
import { isValidUrlSafe } from "./isValidUrlSafe.js";
import { toBase64 } from "./toBase64.js";
import { toBase64Url } from "./toBase64Url.js";
import { toBytes } from "./toBytes.js";
import { toBytesUrlSafe } from "./toBytesUrlSafe.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
import { toString } from "./toString.js";
import { toStringUrlSafe } from "./toStringUrlSafe.js";

// Export individual functions
export {
	// Constructors
	from,
	fromUrlSafe,
	// Encoding
	encode,
	encodeString,
	encodeUrlSafe,
	encodeStringUrlSafe,
	// Decoding
	decode,
	decodeToString,
	decodeUrlSafe,
	decodeUrlSafeToString,
	// Conversions
	toBytes,
	toBytesUrlSafe,
	toString,
	toStringUrlSafe,
	toBase64,
	toBase64Url,
	// Validation
	isValid,
	isValidUrlSafe,
	// Utils
	calcEncodedSize,
	calcDecodedSize,
};

/**
 * Base64 encoding/decoding namespace
 *
 * Standard and URL-safe base64 encoding with proper padding.
 * Built on Web APIs for maximum performance and compatibility.
 *
 * @example
 * ```typescript
 * // Encode bytes to base64
 * const data = new Uint8Array([1, 2, 3]);
 * const encoded = Base64.encode(data);
 *
 * // Decode base64 to bytes
 * const decoded = Base64.decode(encoded);
 *
 * // URL-safe encoding
 * const urlSafe = Base64.encodeUrlSafe(data);
 *
 * // Branded types
 * const b64 = Base64.from("SGVsbG8=");
 * const bytes = Base64.toBytes(b64);
 * ```
 */
export const Base64 = {
	// Constructors
	from,
	fromUrlSafe,
	// Encoding
	encode,
	encodeString,
	encodeUrlSafe,
	encodeStringUrlSafe,
	// Decoding
	decode,
	decodeToString,
	decodeUrlSafe,
	decodeUrlSafeToString,
	// Conversions
	toBytes,
	toBytesUrlSafe,
	toString,
	toStringUrlSafe,
	toBase64,
	toBase64Url,
	// Validation
	isValid,
	isValidUrlSafe,
	// Utils
	calcEncodedSize,
	calcDecodedSize,
};
