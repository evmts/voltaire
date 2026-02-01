/**
 * Count set bits (population count) in Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Value
 * @returns {number} Number of set bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(0b1111n);
 * const result = Uint64.popCount(a); // 4
 * ```
 */
export function popCount(uint) {
    let count = 0;
    let n = /** @type {bigint} */ (uint);
    while (n > 0n) {
        count += Number(n & 1n);
        n = n >> 1n;
    }
    return count;
}
