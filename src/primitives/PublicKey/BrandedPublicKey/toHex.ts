import { Hex } from "../../Hex/index.js";
import type { BrandedPublicKey } from "./BrandedPublicKey.js";

/**
 * Convert PublicKey to hex string
 *
 * @param this - Public key
 * @returns Hex string
 *
 * @example
 * ```typescript
 * const hex = PublicKey._toHex.call(pk);
 * ```
 */
export function toHex(this: BrandedPublicKey): string {
	const brandedHex = Hex.fromBytes(this);
	return Hex.toString(brandedHex);
}
