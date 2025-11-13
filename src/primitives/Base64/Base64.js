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
import { from } from "./BrandedBase64/from.js";
import { fromUrlSafe } from "./BrandedBase64/fromUrlSafe.js";
import { isValid } from "./BrandedBase64/isValid.js";
import { isValidUrlSafe } from "./BrandedBase64/isValidUrlSafe.js";
import { toBase64 } from "./BrandedBase64/toBase64.js";
import { toBase64Url } from "./BrandedBase64/toBase64Url.js";
import { toBytes } from "./BrandedBase64/toBytes.js";
import { toBytesUrlSafe } from "./BrandedBase64/toBytesUrlSafe.js";
import { toString } from "./BrandedBase64/toString.js";
import { toStringUrlSafe } from "./BrandedBase64/toStringUrlSafe.js";

// Export types
export type { BrandedBase64, Base64Like } from "./BrandedBase64/BrandedBase64.js";
export type {
	BrandedBase64Url,
	Base64UrlLike,
} from "./BrandedBase64/BrandedBase64Url.js";

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
