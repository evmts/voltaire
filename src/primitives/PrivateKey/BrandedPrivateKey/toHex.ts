import * as Hex from "../../Hex/index.js";
import type { BrandedPrivateKey } from "./BrandedPrivateKey.js";

/**
 * Convert PrivateKey to hex string
 *
 * @param this - Private key
 * @returns Hex string
 *
 * @example
 * ```typescript
 * const hex = PrivateKey._toHex.call(pk);
 * ```
 */
export function toHex(this: BrandedPrivateKey): string {
	return Hex.fromBytes(this);
}
