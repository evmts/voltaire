import * as Uint from "../Uint/index.js";
/**
 * Convert GasLimit to bigint
 *
 * @this {import('./GasLimitType.js').GasLimitType}
 * @returns {bigint} BigInt
 *
 * @example
 * ```typescript
 * const n = GasLimit._toBigInt.call(limit);
 * ```
 */
export function gasLimitToBigInt() {
    return Uint.toBigInt(/** @type {*} */ (this));
}
