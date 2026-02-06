/**
 * Create Selector from various input types
 *
 * @param {import('./SelectorType.js').SelectorLike} value - Input value
 * @returns {import('./SelectorType.js').SelectorType} 4-byte selector
 * @throws {Error} If input is invalid
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const sel = Selector.from('0xa9059cbb');
 * const sel2 = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
 * ```
 */
export function from(value: import("./SelectorType.js").SelectorLike): import("./SelectorType.js").SelectorType;
//# sourceMappingURL=from.d.ts.map