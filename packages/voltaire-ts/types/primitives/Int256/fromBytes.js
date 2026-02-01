import { IntegerOverflowError, IntegerUnderflowError, InvalidLengthError, } from "../errors/index.js";
import { BITS, MAX, MIN, MODULO, SIZE } from "./constants.js";
/**
 * Create Int256 from bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array (32 bytes)
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidLengthError} If bytes length is incorrect
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const bytes = new Uint8Array(32);
 * bytes[31] = 0xff; // -1
 * const value = Int256.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
    if (bytes.length !== SIZE) {
        throw new InvalidLengthError(`Int256 requires ${SIZE} bytes, got ${bytes.length}`, {
            value: bytes,
            expected: `${SIZE} bytes`,
            docsPath: "/primitives/int256#from-bytes",
        });
    }
    // Parse as unsigned
    let unsigned = 0n;
    for (let i = 0; i < SIZE; i++) {
        unsigned = (unsigned << 8n) | BigInt(/** @type {number} */ (bytes[i]));
    }
    // Convert from two's complement if high bit is set
    const highBit = 2n ** BigInt(BITS - 1);
    const value = unsigned >= highBit ? unsigned - MODULO : unsigned;
    if (value > MAX) {
        throw new IntegerOverflowError(`Int256 value exceeds maximum (${MAX}): ${value}`, {
            value,
            max: MAX,
            type: "int256",
        });
    }
    if (value < MIN) {
        throw new IntegerUnderflowError(`Int256 value below minimum (${MIN}): ${value}`, {
            value,
            min: MIN,
            type: "int256",
        });
    }
    return /** @type {import('./Int256Type.js').BrandedInt256} */ (value);
}
