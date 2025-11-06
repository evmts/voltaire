import * as Uint from "../../Uint/index.js";
import type { BrandedNonce } from "./BrandedNonce.js";

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
export function toBigInt(this: BrandedNonce): bigint {
	return Uint.toBigInt(this);
}
