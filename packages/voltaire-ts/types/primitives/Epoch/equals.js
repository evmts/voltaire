/**
 * Check if Epoch values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/epoch for Epoch documentation
 * @since 0.0.0
 * @param {import('./EpochType.js').EpochType} a - First epoch
 * @param {import('./EpochType.js').EpochType} b - Second epoch
 * @returns {boolean} true if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Epoch from './primitives/Epoch/index.js';
 * const a = Epoch.from(100000n);
 * const b = Epoch.from(100000n);
 * const result = Epoch.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
    return a === b;
}
