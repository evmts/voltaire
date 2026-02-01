import * as Uint from "../Uint/index.js";
/**
 * Convert Nonce to bigint
 *
 * @this {import('./NonceType.js').NonceType}
 * @returns {bigint} BigInt
 *
 * @example
 * ```typescript
 * const n = Nonce._toBigInt.call(nonce);
 * ```
 */
export function toBigInt() {
    return Uint.toBigInt(
    /** @type {import('../Uint/index.js').Type} */ (
    /** @type {unknown} */ (this)));
}
