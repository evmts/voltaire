import { fromBytes } from "./fromBytes.js";
import { InvalidValueError } from "./errors.js";

/**
 * Create EncodedData from various input types
 *
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./EncodedDataType.js').EncodedDataType} EncodedData
 * @throws {InvalidValueError} If value type is unsupported
 * @throws {InvalidHexFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const data1 = EncodedData.from("0x0000...");
 * const data2 = EncodedData.from(new Uint8Array([0, 0, ...]));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		// Validate hex format
		if (!value.startsWith("0x")) {
			throw new InvalidValueError("Hex string must start with 0x", { value });
		}
		if (!/^0x[0-9a-fA-F]*$/.test(value)) {
			throw new InvalidValueError("Invalid hex string", { value });
		}
		return /** @type {import('./EncodedDataType.js').EncodedDataType} */ (
			value
		);
	}
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	throw new InvalidValueError("Unsupported EncodedData value type", {
		value,
		expected: "string or Uint8Array",
	});
}
