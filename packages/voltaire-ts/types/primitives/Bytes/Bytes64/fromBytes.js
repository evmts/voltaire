import { InvalidLengthError } from "../../errors/index.js";
import { SIZE } from "./constants.js";
/**
 * Create Bytes64 from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 64 bytes)
 * @returns {import('./Bytes64Type.js').Bytes64Type} Bytes64
 * @throws {InvalidLengthError} If bytes is wrong length
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const bytes = Bytes64.fromBytes(new Uint8Array(64));
 * ```
 */
export function fromBytes(bytes) {
    if (bytes.length !== SIZE) {
        throw new InvalidLengthError(`Bytes64 must be ${SIZE} bytes, got ${bytes.length}`, {
            code: -32602,
            value: bytes,
            expected: `${SIZE} bytes`,
            context: { actualLength: bytes.length },
            docsPath: "/primitives/bytes/bytes64",
        });
    }
    return /** @type {import('./Bytes64Type.js').Bytes64Type} */ (new Uint8Array(bytes));
}
