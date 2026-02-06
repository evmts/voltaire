/**
 * Create Selector from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./SelectorType.js').SelectorType} 4-byte selector
 * @throws {Error} If hex is not 4 bytes
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const sel = Selector.fromHex('0xa9059cbb');
 * ```
 */
export function fromHex(hex: string): import("./SelectorType.js").SelectorType;
//# sourceMappingURL=fromHex.d.ts.map