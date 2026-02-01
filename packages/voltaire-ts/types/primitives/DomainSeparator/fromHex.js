import * as Hex from "../Hex/index.js";
import { fromBytes } from "./fromBytes.js";
/**
 * Create DomainSeparator from hex string
 *
 * @param {string} hex - Hex string with optional 0x prefix (must be 66 chars with 0x or 64 without)
 * @returns {import('./DomainSeparatorType.js').DomainSeparatorType} DomainSeparator
 * @throws {InvalidDomainSeparatorLengthError} If bytes length is not 32
 * @throws {import('../Hex/errors.js').InvalidHexError} If hex string is invalid
 * @example
 * ```javascript
 * const sep = DomainSeparator.fromHex('0x1234...');
 * ```
 */
export function fromHex(hex) {
    const bytes = Hex.toBytes(hex);
    return fromBytes(bytes);
}
