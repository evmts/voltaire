import { ZERO } from "./constants.js";
/**
 * Calculate greatest common divisor using Euclidean algorithm
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} a - First value
 * @param {import('./Uint256Type.js').Uint256Type} b - Second value
 * @returns {import('./Uint256Type.js').Uint256Type} GCD of a and b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.gcd(Uint256.from(48n), Uint256.from(18n)); // 6n
 * ```
 */
export function gcd(a, b) {
    let x = a;
    let y = b;
    while (y !== ZERO) {
        const temp = y;
        y = /** @type {import('./Uint256Type.js').Uint256Type} */ (x % y);
        x = temp;
    }
    return x;
}
