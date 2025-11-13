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
import { toString } from "./toString.js";
import { toStringUrlSafe } from "./toStringUrlSafe.js";

// Export types
export type { BrandedBase64, Base64Like } from "./BrandedBase64.js";
export type { BrandedBase64Url, Base64UrlLike } from "./BrandedBase64Url.js";

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

// Namespace export
export const BrandedBase64 = {
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
