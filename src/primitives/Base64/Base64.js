// @ts-nocheck
import { calcDecodedSize } from "./BrandedBase64/calcDecodedSize.js";
import { calcEncodedSize } from "./BrandedBase64/calcEncodedSize.js";
import { decode } from "./BrandedBase64/decode.js";
import { decodeToString } from "./BrandedBase64/decodeToString.js";
import { decodeUrlSafe } from "./BrandedBase64/decodeUrlSafe.js";
import { decodeUrlSafeToString } from "./BrandedBase64/decodeUrlSafeToString.js";
import { encode } from "./BrandedBase64/encode.js";
import { encodeString } from "./BrandedBase64/encodeString.js";
import { encodeStringUrlSafe } from "./BrandedBase64/encodeStringUrlSafe.js";
import { encodeUrlSafe } from "./BrandedBase64/encodeUrlSafe.js";
import { isValid } from "./BrandedBase64/isValid.js";
import { isValidUrlSafe } from "./BrandedBase64/isValidUrlSafe.js";

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
