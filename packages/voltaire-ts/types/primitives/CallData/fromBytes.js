import { brand } from "../../brand.js";
import { MIN_SIZE } from "./constants.js";
import { InvalidCallDataLengthError } from "./errors.js";
/**
 * Create CallData from Uint8Array (zero-copy)
 *
 * @param {Uint8Array} bytes - Raw byte array representing calldata
 * @returns {import('./CallDataType.js').CallDataType} Branded CallData
 * @throws {InvalidCallDataLengthError} If bytes length is less than 4
 *
 * @example
 * ```javascript
 * const bytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
 * const calldata = CallData.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
    if (bytes.length < MIN_SIZE) {
        throw new InvalidCallDataLengthError(`CallData must be at least ${MIN_SIZE} bytes, got ${bytes.length}`, { value: bytes, expected: `at least ${MIN_SIZE} bytes` });
    }
    // Brand the bytes array (zero-copy)
    Object.defineProperty(bytes, brand, {
        value: "CallData",
        writable: false,
        enumerable: false,
        configurable: false,
    });
    return /** @type {import('./CallDataType.js').CallDataType} */ (bytes);
}
