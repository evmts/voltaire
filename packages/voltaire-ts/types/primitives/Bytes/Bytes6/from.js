import * as BytesType from "../Bytes.index.js";
import { InvalidBytesLengthError } from "../errors.js";
/**
 * @param {Uint8Array | string} value
 * @returns {import('./Bytes6Type.js').Bytes6Type}
 */
export function from(value) {
    const bytes = BytesType.from(value);
    if (bytes.length !== 6) {
        throw new InvalidBytesLengthError("Bytes6 must be exactly 6 bytes", {
            expected: "6 bytes",
            context: { actual: bytes.length },
        });
    }
    return /** @type {import('./Bytes6Type.js').Bytes6Type} */ (
    /** @type {unknown} */ (bytes));
}
