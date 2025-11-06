import { Hex } from "../../Hex/index.js";
import type { BrandedPublicKey } from "./BrandedPublicKey.js";

/**
 * Create PublicKey from hex string
 *
 * @param hex - Hex string (64 bytes uncompressed)
 * @returns Public key
 * @throws If hex is not 64 bytes
 *
 * @example
 * ```typescript
 * const pk = PublicKey.from("0x1234...");
 * ```
 */
export function from(hex: string): BrandedPublicKey {
	const brandedHex = Hex(hex);
	const bytes = Hex.toBytes(brandedHex);
	if (bytes.length !== 64) {
		throw new Error(`Public key must be 64 bytes, got ${bytes.length}`);
	}
	return bytes as BrandedPublicKey;
}
