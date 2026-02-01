import { Uint128EmptyInputError } from "./errors.js";
import { minimum } from "./minimum.js";
/**
 * Get minimum value from array
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type[]} values - Array of values
 * @returns {import('./Uint128Type.js').Uint128Type} Minimum value
 * @throws {Uint128EmptyInputError} If array is empty
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(100n), Uint128.from(50n), Uint128.from(75n)];
 * const min = Uint128.min(values); // 50n
 * ```
 */
export function min(values) {
    if (values.length === 0) {
        throw new Uint128EmptyInputError("Cannot find minimum of empty array");
    }
    let result = /** @type {import('./Uint128Type.js').Uint128Type} */ (values[0]);
    for (let i = 1; i < values.length; i++) {
        result = minimum(result, 
        /** @type {import('./Uint128Type.js').Uint128Type} */ (values[i]));
    }
    return result;
}
