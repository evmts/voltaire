/**
 * Check if two RuntimeCode instances are equal
 *
 * @param {import('./RuntimeCodeType.js').RuntimeCodeType} a - First RuntimeCode
 * @param {import('./RuntimeCodeType.js').RuntimeCodeType} b - Second RuntimeCode
 * @returns {boolean} true if equal
 * @example
 * ```javascript
 * import * as RuntimeCode from './primitives/RuntimeCode/index.js';
 * const code1 = RuntimeCode.from("0x6001");
 * const code2 = RuntimeCode.from("0x6001");
 * RuntimeCode._equals(code1, code2); // true
 * ```
 */
export function equals(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
