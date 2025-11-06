import { Hex } from "../../Hex/index.js";
import type { BrandedPrivateKey } from "./BrandedPrivateKey.js";

/**
 * Create PrivateKey from hex string
 *
 * @param hex - Hex string (32 bytes)
 * @returns Private key
 * @throws If hex is not 32 bytes
 *
 * @example
 * ```typescript
 * const pk = PrivateKey.from("0x1234...");
 * ```
 */
export function from(hex: string): BrandedPrivateKey {
	const brandedHex = Hex(hex);
	const bytes = Hex.toBytes(brandedHex);
	if (bytes.length !== 32) {
		throw new Error(`Private key must be 32 bytes, got ${bytes.length}`);
	}
	return bytes as BrandedPrivateKey;
}
