import { MAX } from "./constants.js";
import { Uint16InvalidHexError, Uint16NegativeError, Uint16OverflowError, } from "./errors.js";
/**
 * Create Uint16 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16InvalidHexError} If hex string is invalid
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.fromHex("0xffff");
 * const b = Uint16.fromHex("ffff");
 * ```
 */
export function fromHex(hex) {
    const cleanHex = hex.startsWith("0x") || hex.startsWith("0X") ? hex : `0x${hex}`;
    const value = Number.parseInt(cleanHex, 16);
    if (Number.isNaN(value)) {
        throw new Uint16InvalidHexError(`Invalid hex string: ${hex}`, {
            value: hex,
        });
    }
    if (value < 0) {
        throw new Uint16NegativeError(`Uint16 value cannot be negative: ${value}`, {
            value,
        });
    }
    if (value > MAX) {
        throw new Uint16OverflowError(`Uint16 value exceeds maximum (65535): ${value}`, { value });
    }
    return /** @type {import('./Uint16Type.js').Uint16Type} */ (value);
}
