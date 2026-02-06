import { MAX, ONE } from "./constants.js";
/**
 * Multiply multiple Uint256 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {...import('./Uint256Type.js').Uint256Type} values - Values to multiply
 * @returns {import('./Uint256Type.js').Uint256Type} Product of all values mod 2^256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.product(Uint256.from(10n), Uint256.from(5n), Uint256.from(2n)); // 100n
 * ```
 */
export function product(...values) {
    let result = ONE;
    for (const value of values) {
        result = /** @type {import('./Uint256Type.js').Uint256Type} */ ((result * value) & MAX);
    }
    return result;
}
