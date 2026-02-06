import { MAX } from "./constants.js";
/**
 * Raise Uint64 to power with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Base
 * @param {import('./Uint64Type.js').Uint64Type} exp - Exponent
 * @returns {import('./Uint64Type.js').Uint64Type} Result (uint ^ exp) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const base = Uint64.from(2n);
 * const exp = Uint64.from(10n);
 * const result = Uint64.toPower(base, exp); // 1024n
 * ```
 */
export function toPower(uint, exp) {
    if (exp === 0n)
        return /** @type {import('./Uint64Type.js').Uint64Type} */ (1n);
    if (exp === 1n)
        return uint;
    let result = 1n;
    let base = /** @type {bigint} */ (uint);
    let exponent = /** @type {bigint} */ (exp);
    while (exponent > 0n) {
        if (exponent & 1n) {
            result = (result * base) & MAX;
        }
        base = (base * base) & MAX;
        exponent = exponent >> 1n;
    }
    return /** @type {import('./Uint64Type.js').Uint64Type} */ (result);
}
