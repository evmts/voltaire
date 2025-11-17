import * as Uint from "../Uint/index.js";

/**
 * Convert Nonce to bigint
 *
 * @param this - Nonce
 * @returns BigInt
 *
 * @example
 * ```typescript
 * const n = Nonce._toBigInt.call(nonce);
 * ```
 */
export function toBigInt() {
	return Uint.toBigInt(this);
}
