import { InvalidValueError } from "./errors.js";
import { fromHex } from "./fromHex.js";
import { fromString } from "./fromString.js";
/**
 * Create Bytes from various input types (universal constructor)
 *
 * @param {Uint8Array | string | number[]} value - Uint8Array, hex string, UTF-8 string, or number array
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {InvalidValueError} If value type is unsupported or invalid
 *
 * @example
 * ```typescript
 * const b1 = Bytes.from(new Uint8Array([0x01, 0x02]));
 * const b2 = Bytes.from("0x1234");
 * const b3 = Bytes.from("hello");
 * const b4 = Bytes.from([0x01, 0x02, 0x03]);
 * ```
 */
export function from(value) {
    if (value instanceof Uint8Array) {
        return /** @type {import('./BytesType.js').BytesType} */ (value);
    }
    if (Array.isArray(value)) {
        return /** @type {import('./BytesType.js').BytesType} */ (new Uint8Array(value));
    }
    if (typeof value === "string") {
        if (value.startsWith("0x")) {
            return fromHex(value);
        }
        return fromString(value);
    }
    throw new InvalidValueError("Unsupported bytes value type", {
        value,
        expected: "Uint8Array, string, or number[]",
    });
}
