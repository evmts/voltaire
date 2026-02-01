import * as Hex from "../Hex/index.js";

/**
 * Convert DomainSeparator to hex string with 0x prefix
 *
 * @param {import('./DomainSeparatorType.js').DomainSeparatorType} separator - DomainSeparator
 * @returns {string} Hex string with 0x prefix
 * @example
 * ```javascript
 * const hex = DomainSeparator.toHex(separator);
 * console.log(hex); // '0x1234...'
 * ```
 */
export function toHex(separator) {
	return Hex.fromBytes(separator);
}
