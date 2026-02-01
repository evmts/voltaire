import { InvalidSizeError, SizeExceededError } from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { toBytes } from "./toBytes.js";
/**
 * Pad hex to target size (left-padded with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes (must be non-negative integer)
 * @returns {string} Padded hex string
 * @throws {InvalidSizeError} If targetSize is not a non-negative integer
 * @throws {SizeExceededError} If hex exceeds target size
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const padded = Hex.pad(hex, 4); // '0x00001234'
 * Hex.pad('0x1234', 1); // throws SizeExceededError (2 bytes > 1 byte target)
 * Hex.pad('0x1234', -1); // throws InvalidSizeError
 * Hex.pad('0x1234', 1.5); // throws InvalidSizeError
 * ```
 */
export function pad(hex, targetSize) {
    if (!Number.isInteger(targetSize) || targetSize < 0) {
        throw new InvalidSizeError(`Invalid target size: ${targetSize}. Size must be a non-negative integer.`, {
            value: targetSize,
            expected: "non-negative integer",
            context: { targetSize },
        });
    }
    const bytes = toBytes(/** @type {import('./HexType.js').HexType} */ (hex));
    if (bytes.length > targetSize) {
        throw new SizeExceededError(`Hex size (${bytes.length} bytes) exceeds padding size (${targetSize} bytes).`, {
            value: hex,
            expected: `${targetSize} bytes or fewer`,
            context: { actualSize: bytes.length, targetSize },
        });
    }
    if (bytes.length === targetSize) {
        return /** @type {import('./HexType.js').HexType} */ (fromBytes(bytes));
    }
    const padded = new Uint8Array(targetSize);
    padded.set(bytes, targetSize - bytes.length);
    return /** @type {import('./HexType.js').HexType} */ (fromBytes(padded));
}
