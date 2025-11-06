import type { BrandedPrivateKey } from "./BrandedPrivateKey.js";

const HEX_REGEX = /^[0-9a-fA-F]+$/;

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
	const hexStr = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!HEX_REGEX.test(hexStr)) {
		throw new Error("Invalid hex string");
	}
	if (hexStr.length !== 64) {
		throw new Error(
			`Private key must be 32 bytes (64 hex chars), got ${hexStr.length}`,
		);
	}
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as BrandedPrivateKey;
}
