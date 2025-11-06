import * as Uint from "../../Uint/index.js";
import type { BrandedNonce } from "./BrandedNonce.js";

/**
 * Increment nonce by 1
 *
 * @param this - Nonce
 * @returns New nonce incremented by 1
 *
 * @example
 * ```typescript
 * const next = Nonce._increment.call(nonce);
 * ```
 */
export function increment(this: BrandedNonce): BrandedNonce {
	const current = Uint.toBigInt(this);
	return Uint.from(current + 1n) as BrandedNonce;
}
