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
import { isValid } from "./isValid.js";
import { isValidUrlSafe } from "./isValidUrlSafe.js";

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

// Namespace export
export const BrandedBase64 = {
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
