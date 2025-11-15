import type { PublicKeyType } from "../PublicKeyType.js";

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
export function toHex(this: PublicKeyType): string {
	return `0x${Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
