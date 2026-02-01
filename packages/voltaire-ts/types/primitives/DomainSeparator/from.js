import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
/**
 * Create DomainSeparator from string or bytes
 *
 * @param {string | Uint8Array} value - Hex string with optional 0x prefix or Uint8Array
 * @returns {import('./DomainSeparatorType.js').DomainSeparatorType} DomainSeparator bytes
 * @throws {InvalidDomainSeparatorLengthError} If bytes length is not 32
 * @throws {import('../Hex/errors.js').InvalidHexError} If hex string is invalid
 * @example
 * ```javascript
 * import * as DomainSeparator from './primitives/DomainSeparator/index.js';
 * const sep = DomainSeparator.from('0x1234...');
 * const sep2 = DomainSeparator.from(new Uint8Array(32));
 * ```
 */
export function from(value) {
    if (typeof value === "string") {
        return fromHex(value);
    }
    return fromBytes(value);
}
