import { InvalidBlockHashFormatError } from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
/**
 * Create BlockHash from various input types
 *
 * @param {string | Uint8Array} value
 * @returns {import('./BlockHashType.js').BlockHashType}
 * @throws {InvalidBlockHashFormatError}
 */
export function from(value) {
    if (typeof value === "string") {
        return fromHex(value);
    }
    if (value instanceof Uint8Array) {
        return fromBytes(value);
    }
    throw new InvalidBlockHashFormatError("Unsupported BlockHash value type", {
        value,
        expected: "string or Uint8Array",
    });
}
