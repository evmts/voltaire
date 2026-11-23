import { encodeHexDigits } from "../Hex/encodeHexDigits.js";
import type { PrivateKeyType } from "./PrivateKeyType.js";

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
export function toHex(this: PrivateKeyType): string {
	return `0x${encodeHexDigits(this)}`;
}
