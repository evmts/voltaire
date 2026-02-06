import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";
/**
 * @param {Uint8Array | string} value
 * @returns {import('./Bytes5Type.js').Bytes5Type}
 */
export function from(value) {
    const bytes = BytesType.from(value);
    if (bytes.length !== 5) {
        throw new InvalidBytesLengthError("Bytes5 must be exactly 5 bytes", {
            expected: "5 bytes",
            context: { actual: bytes.length },
        });
    }
    return /** @type {import('./Bytes5Type.js').Bytes5Type} */ (
    /** @type {unknown} */ (bytes));
}
