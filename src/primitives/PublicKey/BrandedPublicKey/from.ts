import type { BrandedPublicKey } from "./BrandedPublicKey.js";

const HEX_REGEX = /^[0-9a-fA-F]+$/;

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
	const hexStr = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!HEX_REGEX.test(hexStr)) {
		throw new Error("Invalid hex string");
	}
	if (hexStr.length !== 128) {
		throw new Error(
			`Public key must be 64 bytes (128 hex chars), got ${hexStr.length}`,
		);
	}
	const bytes = new Uint8Array(64);
	for (let i = 0; i < 64; i++) {
		bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as BrandedPublicKey;
}
