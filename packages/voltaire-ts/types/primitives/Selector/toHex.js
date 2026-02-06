import * as Hex from "../Hex/index.js";
/**
 * Convert Selector to hex string
 *
 * @param {import('./SelectorType.js').SelectorType} selector - 4-byte selector
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const hex = Selector.toHex(selector);
 * // '0xa9059cbb'
 * ```
 */
export function toHex(selector) {
    return Hex.fromBytes(selector);
}
