import { fromHex } from "./fromHex.js";
import { fromBytes } from "./fromBytes.js";
import { InvalidValueError } from "./errors.js";

/**
 * Create ReturnData from various input types
 *
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./ReturnDataType.js').ReturnDataType} ReturnData
 * @throws {InvalidValueError} If value type is unsupported
 * @throws {InvalidHexFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const data1 = ReturnData.from("0x0000...");
 * const data2 = ReturnData.from(new Uint8Array([0, 0, ...]));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	throw new InvalidValueError("Unsupported ReturnData value type", {
		value,
		expected: "string or Uint8Array",
	});
}
