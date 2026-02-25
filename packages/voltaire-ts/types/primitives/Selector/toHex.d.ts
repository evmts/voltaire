/**
 * Convert Selector to hex string
 *
 * @param {import('./SelectorType.js').SelectorType} selector - 4-byte selector
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const hex = Selector.toHex(selector);
 * // '0xa9059cbb'
 * ```
 */
export function toHex(selector: import("./SelectorType.js").SelectorType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map