import * as Uint from "../../Uint/index.js";
import type { BrandedNonce } from "./BrandedNonce.js";

/**
 * Convert Nonce to number
 *
 * @param this - Nonce
 * @returns Number
 * @throws If nonce exceeds safe integer range
 *
 * @example
 * ```typescript
 * const n = Nonce._toNumber.call(nonce);
 * ```
 */
export function toNumber(this: BrandedNonce): number {
	return Uint.toNumber(this);
}
