import { encodeUrlSafe } from "./encodeUrlSafe.js";
import { isValidUrlSafe } from "./isValidUrlSafe.js";

/**
 * Convert input to BrandedBase64Url
 *
 * @param {import('./BrandedBase64Url.js').Base64UrlLike} value - Input to convert
 * @returns {import('./BrandedBase64Url.js').BrandedBase64Url} Branded Base64Url string
 * @throws {TypeError} If input cannot be converted to valid Base64Url
 *
 * @example
 * ```typescript
 * // From string
 * const b64url = Base64.fromUrlSafe("SGVsbG8");
 *
 * // From bytes
 * const data = new Uint8Array([1, 2, 3]);
 * const b64url = Base64.fromUrlSafe(data);
 * ```
 */
export function fromUrlSafe(value) {
	// Already branded Base64Url
	if (typeof value === "string" && isValidUrlSafe(value)) {
		return value;
	}

	// Convert bytes to Base64Url
	if (value instanceof Uint8Array) {
		return encodeUrlSafe(value);
	}

	// Try to validate string
	if (typeof value === "string") {
		if (!isValidUrlSafe(value)) {
			throw new TypeError(`Invalid Base64Url string: ${value}`);
		}
		return value;
	}

	throw new TypeError(
		`Cannot convert to BrandedBase64Url: ${typeof value}. Expected string or Uint8Array.`,
	);
}
