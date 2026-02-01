import { IntegerOverflowError, IntegerUnderflowError, } from "../errors/index.js";
import { MAX, MIN } from "./constants.js";
/**
 * Create Int128 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt value
 * @returns {import('./Int128Type.js').BrandedInt128} Int128 value
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.fromBigInt(-42n);
 * const b = Int128.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
    if (value > MAX) {
        throw new IntegerOverflowError(`Int128 value exceeds maximum (${MAX}): ${value}`, {
            value,
            max: MAX,
            type: "int128",
        });
    }
    if (value < MIN) {
        throw new IntegerUnderflowError(`Int128 value below minimum (${MIN}): ${value}`, {
            value,
            min: MIN,
            type: "int128",
        });
    }
    return /** @type {import('./Int128Type.js').BrandedInt128} */ (value);
}
