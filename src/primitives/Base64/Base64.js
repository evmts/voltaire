// @ts-nocheck
import { encode } from "./encode.js";
import { decode } from "./decode.js";
import { encodeUrlSafe } from "./encodeUrlSafe.js";
import { decodeUrlSafe } from "./decodeUrlSafe.js";
import { encodeString } from "./encodeString.js";
import { decodeToString } from "./decodeToString.js";
import { encodeStringUrlSafe } from "./encodeStringUrlSafe.js";
import { decodeUrlSafeToString } from "./decodeUrlSafeToString.js";
import { isValid } from "./isValid.js";
import { isValidUrlSafe } from "./isValidUrlSafe.js";
import { calcEncodedSize } from "./calcEncodedSize.js";
import { calcDecodedSize } from "./calcDecodedSize.js";

// Export individual functions
export {
	encode,
	decode,
	encodeUrlSafe,
	decodeUrlSafe,
	encodeString,
	decodeToString,
	encodeStringUrlSafe,
	decodeUrlSafeToString,
	isValid,
	isValidUrlSafe,
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
 * ```
 */
export const Base64 = {
	encode,
	decode,
	encodeUrlSafe,
	decodeUrlSafe,
	encodeString,
	decodeToString,
	encodeStringUrlSafe,
	decodeUrlSafeToString,
	isValid,
	isValidUrlSafe,
	calcEncodedSize,
	calcDecodedSize,
};
