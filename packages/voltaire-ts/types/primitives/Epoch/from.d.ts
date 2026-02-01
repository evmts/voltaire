/**
 * Create Epoch from number, bigint, or string
 *
 * @see https://voltaire.tevm.sh/primitives/epoch for Epoch documentation
 * @since 0.0.0
 * @param {number | bigint | string} value - Epoch number (number, bigint, or decimal/hex string)
 * @returns {import('./EpochType.js').EpochType} Epoch value
 * @throws {Error} If value is negative or invalid
 * @example
 * ```javascript
 * import * as Epoch from './primitives/Epoch/index.js';
 * const epoch1 = Epoch.from(100000n);
 * const epoch2 = Epoch.from(100000);
 * const epoch3 = Epoch.from("0x186a0");
 * ```
 */
export function from(value: number | bigint | string): import("./EpochType.js").EpochType;
//# sourceMappingURL=from.d.ts.map