import { encode } from "./encode.js";
import { isValid } from "./isValid.js";

/**
 * Convert input to BrandedBase64
 *
 * @param {import('./BrandedBase64.js').Base64Like} value - Input to convert
 * @returns {import('./BrandedBase64.js').BrandedBase64} Branded Base64 string
 * @throws {TypeError} If input cannot be converted to valid Base64
 *
 * @example
 * ```typescript
 * // From string
 * const b64 = Base64.from("SGVsbG8=");
 *
 * // From bytes
 * const data = new Uint8Array([1, 2, 3]);
 * const b64 = Base64.from(data);
 * ```
 */
export function from(value) {
	// Already branded Base64
	if (typeof value === "string" && isValid(value)) {
		return value;
	}

	// Convert bytes to Base64
	if (value instanceof Uint8Array) {
		return encode(value);
	}

	// Try to validate string
	if (typeof value === "string") {
		if (!isValid(value)) {
			throw new TypeError(`Invalid Base64 string: ${value}`);
		}
		return value;
	}

	throw new TypeError(
		`Cannot convert to BrandedBase64: ${typeof value}. Expected string or Uint8Array.`,
	);
}
