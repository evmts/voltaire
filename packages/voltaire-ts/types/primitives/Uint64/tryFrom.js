import { MAX } from "./constants.js";
/**
 * Try to create Uint64 from value, return null if invalid
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {unknown} value - Value to convert
 * @returns {import('./Uint64Type.js').Uint64Type | null} Uint64 value or null
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.tryFrom(100n); // 100n
 * const b = Uint64.tryFrom(-1n); // null
 * const c = Uint64.tryFrom("not a number"); // null
 * ```
 */
export function tryFrom(value) {
    try {
        if (typeof value === "bigint") {
            if (value >= 0n && value <= MAX) {
                return /** @type {import('./Uint64Type.js').Uint64Type} */ (value);
            }
        }
        return null;
    }
    catch {
        return null;
    }
}
