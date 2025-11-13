import { InvalidValueError } from "./errors.js";
import { fromHex } from "./fromHex.js";
import { fromString } from "./fromString.js";

/**
 * Create Bytes from various input types (universal constructor)
 *
 * @param {Uint8Array | string} value - Uint8Array, hex string, or UTF-8 string
 * @returns {import('./BrandedBytes.js').BrandedBytes} Bytes
 * @throws {InvalidValueError} If value type is unsupported or invalid
 *
 * @example
 * ```typescript
 * const b1 = Bytes.from(new Uint8Array([0x01, 0x02]));
 * const b2 = Bytes.from("0x1234");
 * const b3 = Bytes.from("hello");
 * ```
 */
export function from(value) {
	if (value instanceof Uint8Array) {
		return /** @type {import('./BrandedBytes.js').BrandedBytes} */ (value);
	}
	if (typeof value === "string") {
		if (value.startsWith("0x")) {
			return fromHex(value);
		}
		return fromString(value);
	}
	throw new InvalidValueError("Unsupported bytes value type", {
		value,
		expected: "Uint8Array or string",
	});
}
