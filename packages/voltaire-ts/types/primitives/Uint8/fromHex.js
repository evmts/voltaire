import { MAX } from "./constants.js";
import { Uint8InvalidHexError, Uint8NegativeError, Uint8OverflowError, } from "./errors.js";
/**
 * Create Uint8 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {Uint8InvalidHexError} If hex string is invalid
 * @throws {Uint8NegativeError} If value is negative
 * @throws {Uint8OverflowError} If value exceeds maximum (255)
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.fromHex("0xff");
 * const b = Uint8.fromHex("ff");
 * ```
 */
export function fromHex(hex) {
    const cleanHex = hex.startsWith("0x") || hex.startsWith("0X") ? hex : `0x${hex}`;
    const value = Number.parseInt(cleanHex, 16);
    if (Number.isNaN(value)) {
        throw new Uint8InvalidHexError(`Invalid hex string: ${hex}`, {
            value: hex,
        });
    }
    if (value < 0) {
        throw new Uint8NegativeError(`Uint8 value cannot be negative: ${value}`, {
            value,
        });
    }
    if (value > MAX) {
        throw new Uint8OverflowError(`Uint8 value exceeds maximum (255): ${value}`, { value });
    }
    return /** @type {import('./Uint8Type.js').Uint8Type} */ (value);
}
