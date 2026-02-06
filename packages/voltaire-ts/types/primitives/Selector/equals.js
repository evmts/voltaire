/**
 * Check if two Selectors are equal
 *
 * @param {import('./SelectorType.js').SelectorType} a - First selector
 * @param {import('./SelectorType.js').SelectorType} b - Second selector
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const equal = Selector.equals(sel1, sel2);
 * ```
 */
export function equals(a, b) {
    return a.length === b.length && a.every((byte, index) => byte === b[index]);
}
